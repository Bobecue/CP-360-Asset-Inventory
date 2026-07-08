"use client";

import React from "react";
import { encodeCode39 } from "../_utils/barcode";

interface BarcodeProps {
  text: string;
  height?: number;
  showText?: boolean;
  style?: React.CSSProperties;
}

export const Barcode = ({
  text,
  height = 50,
  showText = true,
  style,
}: BarcodeProps) => {
  const cleanText = text.replace(/[^A-Z0-9\-.$/+% ]/gi, "");
  const { rects, totalWidth } = encodeCode39(cleanText);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", ...style }}>
      <svg
        viewBox={`0 0 ${totalWidth} 100`}
        style={{ width: "100%", height }}
        preserveAspectRatio="none"
      >
        {rects.map((r, idx) => (
          <rect
            key={idx}
            x={r.x}
            y={0}
            width={r.width}
            height={100}
            fill="#000000"
          />
        ))}
      </svg>
      {showText && (
        <span
          style={{
            fontSize: "0.62rem",
            fontWeight: 600,
            fontFamily: "monospace",
            color: "#475569",
            marginTop: "0.15rem",
            letterSpacing: "0.08em",
          }}
        >
          {cleanText}
        </span>
      )}
    </div>
  );
};
