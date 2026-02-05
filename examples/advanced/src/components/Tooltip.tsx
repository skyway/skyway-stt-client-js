import { useState } from "react";
import "./Tooltip.css";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ text, children, position = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && <div className={`tooltip tooltip-${position}`}>{text}</div>}
    </div>
  );
}
