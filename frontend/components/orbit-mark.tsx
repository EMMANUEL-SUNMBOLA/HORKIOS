"use client";

import { useRef } from "react";

export function OrbitMark() {
  const sceneRef = useRef<HTMLDivElement>(null);

  function updateTilt(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    sceneRef.current?.style.setProperty("--tilt-x", `${(-y * 12).toFixed(2)}deg`);
    sceneRef.current?.style.setProperty("--tilt-y", `${(x * 15).toFixed(2)}deg`);
  }

  function resetTilt() {
    sceneRef.current?.style.setProperty("--tilt-x", "0deg");
    sceneRef.current?.style.setProperty("--tilt-y", "0deg");
  }

  return <div className="orbit-stage" onPointerMove={updateTilt} onPointerLeave={resetTilt} aria-hidden="true">
    <div className="orbit-mark" ref={sceneRef}>
      <span className="orbit-system orbit-system-one"><span className="orbit orbit-one"><i className="orbit-node" /></span></span>
      <span className="orbit-system orbit-system-two"><span className="orbit orbit-two"><i className="orbit-node" /></span></span>
      <span className="orbit-system orbit-system-three"><span className="orbit orbit-three"><i className="orbit-node" /></span></span>
      <span className="orbit-axis orbit-axis-vertical" />
      <span className="orbit-axis orbit-axis-horizontal" />
      <span className="orbit-core">H</span>
    </div>
  </div>;
}
