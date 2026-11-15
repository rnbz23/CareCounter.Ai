import { describe, expect, it } from "vitest";
import { resolveHospitalId } from "@/lib/data/hospitals";

describe("hospital selection", () => {
  it("uses an explicit hospital selection", () => {
    expect(resolveHospitalId("sharp-memorial-hospital", "Some Other Hospital")).toBe(
      "sharp-memorial-hospital",
    );
  });

  it("matches a supported hospital from the extracted bill name", () => {
    expect(resolveHospitalId("auto", "Sharp Memorial Hospital")).toBe(
      "sharp-memorial-hospital",
    );
    expect(resolveHospitalId(null, "SHARP MEMORIAL HOSPITAL")).toBe(
      "sharp-memorial-hospital",
    );
  });

  it("returns null when auto-detection has no supported price snapshot", () => {
    expect(resolveHospitalId("auto", "Pacific Coast Medical Center")).toBeNull();
    expect(resolveHospitalId(null, "Unknown Clinic")).toBeNull();
    // A different Sharp campus must not borrow Sharp Memorial's price data.
    expect(resolveHospitalId("auto", "Sharp Mary Birch Hospital for Women")).toBeNull();
  });
});
