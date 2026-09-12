import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const NearbyInput = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  radiusKm: z.number().min(1).max(50).default(15),
});

export type NearbyShop = {
  id: string;
  name: string;
  kind: string;
  lat: number;
  lon: number;
  distanceKm: number;
  address: string;
  phone: string;
};

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Finds farm-supply / fertiliser / seed shops near a point using OpenStreetMap data. */
export const findNearbyShops = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => NearbyInput.parse(input))
  .handler(async ({ data }): Promise<{ shops: NearbyShop[] }> => {
    const radius = Math.round(data.radiusKm * 1000);
    const around = `(around:${radius},${data.lat},${data.lon})`;
    const query = `
      [out:json][timeout:25];
      (
        nwr["shop"="agrarian"]${around};
        nwr["shop"="farm"]${around};
        nwr["shop"="garden_centre"]${around};
        nwr["craft"="agricultural_engines"]${around};
        nwr["shop"="doityourself"]["agrarian"]${around};
        nwr["name"~"fertiliz|fertilis|agro|agri|seed|krishi|खाद|बीज",i]${around};
      );
      out center 40;`;

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data: query }).toString(),
    });
    if (!res.ok) throw new Error("Could not look up shops right now. Please try again.");

    const json = (await res.json()) as { elements?: OverpassElement[] };
    const shops: NearbyShop[] = (json.elements ?? [])
      .map((el) => {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (lat === undefined || lon === undefined) return null;
        const tags = el.tags ?? {};
        const name = tags["name"] ?? tags["operator"] ?? "Farm supply shop";
        const address = [tags["addr:street"], tags["addr:village"], tags["addr:city"]]
          .filter(Boolean)
          .join(", ");
        return {
          id: `${el.type}-${el.id}`,
          name,
          kind: tags["shop"] ?? tags["craft"] ?? "agri",
          lat,
          lon,
          distanceKm: Math.round(distanceKm(data.lat, data.lon, lat, lon) * 10) / 10,
          address,
          phone: tags["phone"] ?? tags["contact:phone"] ?? "",
        } satisfies NearbyShop;
      })
      .filter((s): s is NearbyShop => s !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 20);

    return { shops };
  });
