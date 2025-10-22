import React from "react";

const LoadingAnimation = ({ message = "Loading...", size = 200 }) => {
  return (
    <div className="text-center">
      <style>{`
        @keyframes drawBack {
          0% {
            stroke-dashoffset: 360;
          }
          50% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 360;
          }
        }
        @keyframes drawFront {
          0%, {
            stroke-dashoffset: 360;
          }
          50% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 360;
          }
        }
        .loader-square-back {
          stroke-dasharray: 360;
          stroke-dashoffset: 360;
          stroke-linecap: square;
          animation: drawBack 1.5s ease-in-out infinite;
        }
        .loader-square-front {
          stroke-dasharray: 360;
          stroke-dashoffset: 360;
          stroke-linecap: square;
          animation: drawFront 1.5s ease-in-out infinite;
        }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 150 150"
        className="mx-auto"
        style={{ filter: "drop-shadow(4px 4px 3px rgba(0,0,0,0.3))" }}
      >
        <rect
          className="loader-square-back"
          x="20"
          y="20"
          width="90"
          height="90"
          fill="none"
          stroke="#ffffff"
          strokeWidth="12"
        />
        <rect
          className="loader-square-front"
          x="40"
          y="40"
          width="90"
          height="90"
          fill="none"
          stroke="#ffffff"
          strokeWidth="12"
        />
      </svg>
      {message && (
        <p className="text-gray-400 mt-6 text-lg font-medium">{message}</p>
      )}
    </div>
  );
};

export default LoadingAnimation;
