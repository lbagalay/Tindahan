"use client";

import { useState } from "react";

export function ReceiptBrand({ logo, brandName, compact = false }: { logo: string; brandName: string; compact?: boolean }) {
  const [failedLogo, setFailedLogo] = useState("");
  const isTindahanLogo = logo.endsWith("/tindahan-logo.png");

  const initials = brandName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col items-center text-center">
      {logo && failedLogo !== logo && isTindahanLogo ? (
        <span className={`${compact ? "size-10" : "size-16"} mb-2 overflow-hidden rounded-xl bg-[#173f00]`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={`${brandName} logo`} onError={() => setFailedLogo(logo)} className="size-full scale-[3] object-contain" />
        </span>
      ) : logo && failedLogo !== logo ? (
        // A plain image keeps arbitrary customer-hosted logos printable without remote image-host configuration.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={`${brandName} logo`} onError={() => setFailedLogo(logo)} className={`${compact ? "max-h-10 max-w-24" : "max-h-16 max-w-36"} mb-2 object-contain`} />
      ) : (
        <span className={`${compact ? "size-9 text-xs" : "size-12 text-sm"} mb-2 grid place-items-center rounded-lg border border-[var(--border)] font-extrabold text-[var(--ink-soft)]`}>{initials || "POS"}</span>
      )}
      <p className={`${compact ? "text-sm" : "text-lg"} font-extrabold tracking-tight text-[var(--foreground)]`}>{brandName.toUpperCase()}</p>
    </div>
  );
}
