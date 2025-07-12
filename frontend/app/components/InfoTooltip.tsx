/// <reference lib="dom" />
import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface InfoTooltipProps {
  label: React.ReactNode;
  tooltip: React.ReactNode;
  className?: string;
}

function isReactElementWithProps(
  element: unknown,
): element is React.ReactElement<{ style?: React.CSSProperties }> {
  return React.isValidElement(element) && typeof element.props === "object";
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({
  label,
  tooltip,
  className = "",
}) => {
  const labelRef = useRef<React.ElementRef<"span">>(null);
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (show && labelRef.current) {
      const rect = labelRef.current.getBoundingClientRect();
      setCoords({
        left: rect.left + rect.width / 2,
        top: rect.bottom,
        width: rect.width,
      });
    }
  }, [show]);

  // Hide tooltip on scroll or resize
  useEffect(() => {
    if (!show) return;
    const hide = () => setShow(false);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide, true);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide, true);
    };
  }, [show]);

  return (
    <span
      className={`relative group inline-flex items-center ${className}`}
      style={{ verticalAlign: "baseline" }}
    >
      <span
        ref={labelRef}
        className="cursor-pointer inline-block"
        style={{ verticalAlign: "baseline", outline: "none" }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        tabIndex={0}
      >
        {isReactElementWithProps(label)
          ? React.cloneElement(label, {
              style: {
                ...(label.props.style || {}),
                verticalAlign: "text-bottom",
              },
            })
          : label}
      </span>
      {mounted &&
        show &&
        coords &&
        createPortal(
          <span
            className="fixed z-[10000] opacity-100 transition-opacity duration-200 pointer-events-auto text-sm rounded-lg px-5 py-3 shadow-xl max-w-2xl min-w-[300px] border bg-gray-900 text-white"
            style={{
              left: coords.left,
              top: coords.top + 8, // 8px gap below the label
              transform: "translateX(-50%)",
              borderColor: "var(--card-border)",
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              position: "fixed",
            }}
          >
            {tooltip}
          </span>,
          document.body,
        )}
    </span>
  );
};

export default InfoTooltip;
