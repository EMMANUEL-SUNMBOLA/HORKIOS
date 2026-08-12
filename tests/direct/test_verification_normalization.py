"""Strict verification parsing tests against the production contract helpers."""

import ast
from pathlib import Path
from urllib.parse import urlparse


def _normalizer():
    source = Path("contracts/HorkiosEscrow.py").read_text()
    tree = ast.parse(source)
    contract = next(
        node
        for node in tree.body
        if isinstance(node, ast.ClassDef) and node.name == "HorkiosEscrow"
    )
    methods = [
        node
        for node in contract.body
        if isinstance(node, ast.FunctionDef)
        and node.name in {"_failed_analysis", "_normalize_analysis"}
    ]
    test_class = ast.ClassDef(
        name="Normalizer", bases=[], keywords=[], body=methods, decorator_list=[]
    )
    module = ast.fix_missing_locations(ast.Module(body=[test_class], type_ignores=[]))
    namespace = {"typing": __import__("typing"), "urlparse": urlparse, "MAX_REASON": 500}
    exec(compile(module, "contracts/HorkiosEscrow.py", "exec"), namespace)
    return namespace["Normalizer"]()


def _valid_payload() -> dict[str, object]:
    return {
        "post_exists": True,
        "author": "@Horkios",
        "status_id": "123",
        "content_matches": True,
        "published_at_unix": 2_000_000_000,
        "observed_views": 100,
        "observed_likes": 10,
        "observed_reposts": 2,
        "reason": "Public post meets the demand",
    }


def test_valid_analysis_is_normalized() -> None:
    result = _normalizer()._normalize_analysis(
        _valid_payload(), "horkios", "https://x.com/horkios/status/123"
    )
    assert result["post_exists"] is True
    assert result["author"] == "horkios"
    assert result["status_id"] == "123"


def test_mismatched_status_id_fails_identity_match() -> None:
    payload = _valid_payload()
    payload["status_id"] = "999"
    result = _normalizer()._normalize_analysis(
        payload, "horkios", "https://x.com/horkios/status/123"
    )
    assert result["status_id"] == ""


def test_missing_field_fails_closed() -> None:
    payload = _valid_payload()
    del payload["author"]
    result = _normalizer()._normalize_analysis(
        payload, "horkios", "https://x.com/horkios/status/123"
    )
    assert result["post_exists"] is False
    assert result["observed_views"] == 0


def test_string_boolean_fails_closed() -> None:
    payload = _valid_payload()
    payload["post_exists"] = "false"
    result = _normalizer()._normalize_analysis(
        payload, "horkios", "https://x.com/horkios/status/123"
    )
    assert result["post_exists"] is False
    assert result["content_matches"] is False


def test_invalid_numeric_values_fail_closed() -> None:
    normalizer = _normalizer()
    for invalid in ("100", -1, True, 1 << 256):
        payload = _valid_payload()
        payload["observed_views"] = invalid
        result = normalizer._normalize_analysis(
            payload, "horkios", "https://x.com/horkios/status/123"
        )
        assert result["post_exists"] is False


def test_non_object_payload_fails_closed() -> None:
    result = _normalizer()._normalize_analysis(
        ["not", "an", "object"], "horkios", "https://x.com/horkios/status/123"
    )
    assert result["post_exists"] is False


def test_production_pass_condition_requires_status_id_match() -> None:
    source = Path("contracts/HorkiosEscrow.py").read_text()
    tree = ast.parse(source)
    contract = next(
        node
        for node in tree.body
        if isinstance(node, ast.ClassDef) and node.name == "HorkiosEscrow"
    )
    verify = next(
        node
        for node in contract.body
        if isinstance(node, ast.FunctionDef) and node.name == "_verify"
    )
    passed_assignment = next(
        node
        for node in ast.walk(verify)
        if isinstance(node, ast.Assign)
        and any(isinstance(target, ast.Name) and target.id == "passed" for target in node.targets)
    )
    assert "status_id_matches" in {
        node.id for node in ast.walk(passed_assignment.value) if isinstance(node, ast.Name)
    }
