const getEnvValue = (...keys: string[]): string | undefined => {
  for (const key of keys) {
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return process.env[key];
    }
    if (typeof import.meta !== "undefined" && (import.meta as any)?.env?.[key]) {
      return (import.meta as any).env[key];
    }
    if (typeof globalThis !== "undefined" && (globalThis as any)[key]) {
      return (globalThis as any)[key];
    }
  }
  return undefined;
};

export const CONVEX_URL = "https://adventurous-caiman-347.convex.cloud";

if (!CONVEX_URL) {
  console.warn(
    "[config] CONVEX_URL is not defined. Set VITE_CONVEX_URL or CONVEX_URL to your Convex deployment URL."
  );
}
