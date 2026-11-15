export const AUTO_HOSPITAL_ID = "auto";

export type KnownHospital = {
  id: string;
  label: string;
  aliases: readonly string[];
};

/**
 * Hospitals with a price snapshot available to the comparison pipeline.
 * Add a hospital here only after its prices have been ingested into Neon.
 */
export const KNOWN_HOSPITALS: readonly KnownHospital[] = [
  {
    id: "sharp-memorial-hospital",
    label: "Sharp Memorial Hospital",
    aliases: ["sharp memorial hospital", "sharp memorial"],
  },
];

function normalized(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Resolve the hospital ID used for price comparison.
 *
 * An explicit selection wins. In auto mode, match the hospital name extracted
 * from the bill against the supported snapshot list; unsupported hospitals
 * intentionally fall back to null so no price claim is invented.
 */
export function resolveHospitalId(
  selectedHospitalId: string | null,
  extractedHospitalName: string,
): string | null {
  if (selectedHospitalId && selectedHospitalId !== AUTO_HOSPITAL_ID) {
    return selectedHospitalId;
  }

  const name = normalized(extractedHospitalName);
  const match = KNOWN_HOSPITALS.find((hospital) =>
    hospital.aliases.some((alias) => name.includes(normalized(alias))),
  );

  return match?.id ?? null;
}
