# X verification launch-gate matrix

Populate these URLs immediately before running the Bradbury gate because public
post availability and metrics change over time.

| Case | URL | Expected result |
| --- | --- | --- |
| Accessible original post | | Exact author, status ID, time and content |
| Accessible reply | | Exact author, status ID, time and content |
| Quote post | | Analyze the quoted-post author, not the embedded author |
| Thread opener | | Analyze the canonical status in the URL |
| Wrong author | | `author_matches = false` |
| Content mismatch | | `content_matches = false` |
| Deleted post | | No payout; determinate failure or undetermined |
| Suspended account | | No payout; determinate failure or undetermined |
| Lookalike host | `https://x.com.example.test/a/status/1` | Rejected before web access |
| Query-bearing URL | `https://x.com/a/status/1?s=20` | Rejected before web access |

The gate passes only after every accessible fixture completes three consecutive
five-validator runs with no false passes and stable identity/timestamp decisions.
