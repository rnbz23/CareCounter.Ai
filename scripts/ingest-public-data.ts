import { Readable } from "node:stream";

import { fetchPublicPageWithBrightData } from "../src/lib/data/bright-data";
import { fetchPublicResourceEvidence } from "../src/lib/data/public-resources";
import {
  extractSharpSelectedPrices,
  findSharpMachineReadableFile,
  SELECTED_CPT_CODES,
  SHARP_MEMORIAL_LOCATION,
  SHARP_PRICE_INDEX_URL,
} from "../src/lib/data/sharp-prices";
import {
  savePublicPriceSnapshot,
  savePublicResourceEvidence,
} from "../src/lib/db/neon";

async function main(): Promise<void> {
  const [discovery, resourceEvidence] = await Promise.all([
    fetchPublicPageWithBrightData(SHARP_PRICE_INDEX_URL),
    fetchPublicResourceEvidence(),
  ]);
  const source = findSharpMachineReadableFile(
    discovery.content,
    SHARP_MEMORIAL_LOCATION,
  );

  console.info(
    JSON.stringify({
      event: "bright_data_source_discovery",
      endpointStatus: discovery.status,
      sourceUrl: discovery.sourceUrl,
      retrievedAt: discovery.retrievedAt,
      machineReadableFileUrl: source.mrfUrl,
    }),
  );

  const response = await fetch(source.mrfUrl);
  if (!response.ok || !response.body) {
    throw new Error(`Hospital price file returned HTTP ${response.status}.`);
  }

  const snapshot = await extractSharpSelectedPrices({
    stream: Readable.from(response.body),
    sourceUrl: source.mrfUrl,
    retrievedAt: discovery.retrievedAt,
  });
  const foundCodes = new Set(snapshot.map(({ price }) => price.code));
  const missingCodes = SELECTED_CPT_CODES.filter((code) => !foundCodes.has(code));

  if (missingCodes.length > 0) {
    throw new Error(`Price file did not contain selected codes: ${missingCodes.join(", ")}`);
  }

  await savePublicPriceSnapshot(snapshot);
  await savePublicResourceEvidence(resourceEvidence);
  console.info(
    JSON.stringify({
      event: "public_price_snapshot_saved",
      hospital: SHARP_MEMORIAL_LOCATION,
      codeCount: foundCodes.size,
      priceRecordCount: snapshot.length,
      publicResourceCount: resourceEvidence.length,
    }),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown ingestion error.";
  console.error(JSON.stringify({ event: "public_data_ingestion_failed", message }));
  process.exitCode = 1;
});
