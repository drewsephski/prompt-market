"use client";

import { useEffect, useRef } from "react";

export default function SplineViewer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load the Spline viewer script
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/@splinetool/viewer@1.12.58/build/spline-viewer.js";
    script.async = true;
    
    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px]"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
      }}
    >
      {/* @ts-expect-error - spline-viewer is a custom web component */}
      <spline-viewer url="https://prod.spline.design/RWDJ9t1SrqNbo6nJ/scene.splinecode"></spline-viewer>
      {/* Overlay to hide "Built with Spline" watermark */}
      <div 
        className="absolute bottom-0 right-0 w-44 h-16 bg-neutral-950 pointer-events-none" 
        style={{ zIndex: 9999 }}
      />
    </div>
  );
}
