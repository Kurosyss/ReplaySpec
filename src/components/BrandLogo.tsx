import React from "react";

export type LogoConceptId = "prism" | "prism-shear" | "prism-lattice" | "prism-gauge" | "aperture" | "ledger";

export type BrandLogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  concept?: LogoConceptId;
  iconOnly?: boolean;
  className?: string;
  showTimestamp?: boolean;
};

/**
 * CONCEPT 2 (User's Leading Preference): Iso-Verification Prism (Baseline)
 * - Isometric hexagon sheared along central vertical axis.
 * - Left facet: Observed Browser Reality.
 * - Right facet: Oracle Expected Invariant.
 * - Central pin: Verification Invariant Link.
 */
export function IsoPrismMark({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M11 3.5L4 7.5V16.5L11 20.5V3.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M13 3.5L20 7.5V16.5L13 20.5V3.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <circle cx="12" cy="12" r="1.5" fill="var(--accent, currentColor)" />
    </svg>
  );
}

/**
 * REFINED VARIATION 2A: Prismatic Invariant Shearing (The Dual Plane)
 * - Two precise geometric chevron prisms separated by a 2px differential shear plane.
 * - The left plane represents Observed Behavior; the right represents Expected State.
 * - A centered diamond pip locks the invariant connection.
 * - Exceptional monochrome silhouette down to 16px.
 */
export function IsoShearMark({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Left facet — Observed Reality (Solid stroke with subtle fill) */}
      <path
        d="M10.5 4L3.5 8V16L10.5 20V4Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Right facet — Expected Invariant (Offset parallel proof channel) */}
      <path
        d="M13.5 4L20.5 8V16L13.5 20V4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeDasharray="2.5 1.5"
      />
      {/* Central Invariant Diamond Anchor */}
      <polygon
        points="12,10 14,12 12,14 10,12"
        fill="var(--accent, currentColor)"
      />
    </svg>
  );
}

/**
 * REFINED VARIATION 2B: Geodesic Verification Lattice (The Tripartite Proof Cell)
 * - Hexagonal geodesic prism with 3 interlocking facets:
 *   [Top]: Grounded Video Frame Evidence
 *   [Left]: Preserved User Expectation
 *   [Right]: Browser Execution Verdict
 * - Unmistakable technical authority and architectural precision.
 */
export function IsoLatticeMark({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Top Facet: Evidence Foundation */}
      <path
        d="M12 3L19.5 7.5L12 12L4.5 7.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.1"
      />
      {/* Bottom Left Facet: Specification Invariant */}
      <path
        d="M4.5 7.5V16.5L12 21V12L4.5 7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Bottom Right Facet: Verification Verdict */}
      <path
        d="M19.5 7.5V16.5L12 21V12L19.5 7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.05"
      />
      {/* Central Proof Lattice Node */}
      <circle cx="12" cy="12" r="1.5" fill="var(--accent, currentColor)" />
    </svg>
  );
}

/**
 * REFINED VARIATION 2C: Differential Verification Caliper (The Chrono-Gauge)
 * - Precision laboratory calipers measuring the exact differential delta between observed and expected.
 * - Features micro-graticule tick marks for frame-accurate temporal capture.
 */
export function IsoGaugeMark({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Left Caliper Arm */}
      <path
        d="M9 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20H9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Right Caliper Arm */}
      <path
        d="M15 4H19C20.1046 4 21 4.89543 21 6V18C21 19.1046 20.1046 20 19 20H15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Internal Invariant Optical Axis */}
      <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
      <circle cx="12" cy="12" r="2" fill="var(--accent, currentColor)" />
    </svg>
  );
}

/**
 * CONCEPT 1: Chrono-Aperture (The Calibrated Frame)
 */
export function ChronoApertureMark({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M4 11V7C4 5.34315 5.34315 4 7 4H11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 13V17C20 18.6569 18.6569 20 17 20H13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17 4H18C19.1046 4 20 4.89543 20 6V7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M7 20H6C4.89543 20 4 19.1046 4 18V17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <line x1="12" y1="7" x2="12" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="15.5" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="12" x2="8.5" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15.5" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * CONCEPT 3: Forensic Sequence Ledger (The Temporal Trace)
 */
export function SequenceLedgerMark({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <line x1="7.5" y1="15" x2="7.5" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="10.5" y1="15" x2="10.5" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="13.5" y1="15" x2="13.5" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16.5" y1="15" x2="16.5" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10.5" cy="8" r="1.2" fill="var(--accent, currentColor)" />
    </svg>
  );
}

/**
 * Standalone Mark Selector
 */
export function BrandMark({
  concept = "prism-shear",
  size = 20,
  className = "",
}: {
  concept?: LogoConceptId;
  size?: number;
  className?: string;
}) {
  switch (concept) {
    case "prism":
      return <IsoPrismMark size={size} className={className} />;
    case "prism-shear":
      return <IsoShearMark size={size} className={className} />;
    case "prism-lattice":
      return <IsoLatticeMark size={size} className={className} />;
    case "prism-gauge":
      return <IsoGaugeMark size={size} className={className} />;
    case "ledger":
      return <SequenceLedgerMark size={size} className={className} />;
    case "aperture":
    default:
      return <ChronoApertureMark size={size} className={className} />;
  }
}

/**
 * Editorial Swiss Wordmark + Mark Assembly
 */
export function BrandLogo({
  size = "md",
  concept = "prism-shear",
  iconOnly = false,
  className = "",
  showTimestamp = false,
}: BrandLogoProps) {
  const pixelMap = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };

  const textMap = {
    sm: "text-[13px] tracking-tight",
    md: "text-[14.5px] tracking-tight",
    lg: "text-[16px] tracking-tight",
    xl: "text-[20px] tracking-tight font-semibold",
  };

  const px = pixelMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="flex items-center justify-center text-[var(--text-primary)]">
        <BrandMark concept={concept} size={px} />
      </div>

      {!iconOnly && (
        <div className="flex items-baseline gap-1.5 leading-none">
          <span
            className={`font-semibold text-[var(--text-primary)] ${textMap[size]}`}
            style={{ letterSpacing: "-0.025em" }}
          >
            ReplaySpec
          </span>
          {showTimestamp && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              v0.1
            </span>
          )}
        </div>
      )}
    </div>
  );
}
