const BRIGHT_DATA_ENDPOINT = "https://api.brightdata.com/request";

export class BrightDataConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrightDataConfigurationError";
  }
}

export class BrightDataRequestError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "BrightDataRequestError";
  }
}

export interface BrightDataResult {
  sourceUrl: string;
  retrievedAt: string;
  status: number;
  content: string;
}

export interface BrightDataRequestOptions {
  apiKey?: string;
  zone?: string;
  fetchImplementation?: typeof fetch;
  now?: () => Date;
}

export async function fetchPublicPageWithBrightData(
  sourceUrl: string,
  options: BrightDataRequestOptions = {},
): Promise<BrightDataResult> {
  const apiKey = options.apiKey ?? process.env.BRIGHTDATA_API_KEY;
  const zone = options.zone ?? process.env.BRIGHTDATA_UNLOCKER_ZONE;

  if (!apiKey || !zone) {
    throw new BrightDataConfigurationError(
      "BRIGHTDATA_API_KEY and BRIGHTDATA_UNLOCKER_ZONE are required.",
    );
  }

  const parsedUrl = new URL(sourceUrl);
  if (parsedUrl.protocol !== "https:") {
    throw new BrightDataRequestError("Bright Data source URLs must use HTTPS.", null);
  }

  const fetchImplementation = options.fetchImplementation ?? fetch;
  let response: Response;

  try {
    response = await fetchImplementation(BRIGHT_DATA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ zone, url: parsedUrl.toString(), format: "raw" }),
    });
  } catch (error) {
    throw new BrightDataRequestError("Bright Data request failed.", null, {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new BrightDataRequestError(
      `Bright Data returned HTTP ${response.status}.`,
      response.status,
    );
  }

  return {
    sourceUrl: parsedUrl.toString(),
    retrievedAt: (options.now ?? (() => new Date()))().toISOString(),
    status: response.status,
    content: await response.text(),
  };
}
