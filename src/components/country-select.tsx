"use client";

import type { ChangeEventHandler } from "react";
import { COUNTRY_CODES, normalizeCountryCode } from "@/lib/countries";

const regionNames = new Intl.DisplayNames("en", { type: "region" });
const countries = COUNTRY_CODES
  .map((code) => ({ code, name: regionNames.of(code) ?? code }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function CountrySelect({
  name = "country",
  value,
  defaultValue,
  onChange,
  className,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  className?: string;
}) {
  const props = value === undefined
    ? { defaultValue: normalizeCountryCode(defaultValue) }
    : { value: normalizeCountryCode(value) };

  return (
    <select name={name} onChange={onChange} className={className} {...props}>
      {countries.map((item) => (
        <option key={item.code} value={item.code}>
          {item.name}
        </option>
      ))}
    </select>
  );
}
