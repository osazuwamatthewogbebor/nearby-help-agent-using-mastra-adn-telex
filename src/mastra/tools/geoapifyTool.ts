import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import axios from "axios";
import dotenv from 'dotenv'

dotenv.config();

const geoapify_api_key = process.env.GEOAPIFY_API_KEY;


// Get coordinates
const getCoordinatesService = async (address: string) => {
  try {
    const geoResponse = await axios.get(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${geoapify_api_key}`
    );

    const data = geoResponse.data.features?.[0]?.properties;
    if (!data) throw new Error(`No coordinates found for ${address}`);

    console.log(`Coordinates for ${data.formatted}:`, data.lat, data.lon);
    return data;
  } catch (error: any) {
    console.error(`Error fetching coordinates for ${address}: ${error.message}`);
    throw new Error("Unable to fetch location coordinates.");
  }
};


// Helper: Nearby Places Service
const nearbyHelpService = async (address: string, services: string[]) => {
  const lowerAddress = address.toLowerCase();
  const helpServicesCategories: string[] = [];

  if (Array.isArray(services) && services.length > 0) {
    helpServicesCategories.push(...services);
  }

  if (helpServicesCategories.length === 0) {
    throw new Error("No valid Geoapify categories found for this query.");
  }

  const { lat, lon, place_id } = await getCoordinatesService(lowerAddress);

  const helpServicesResults: Record<string, any[]> = {};

  await Promise.all(
    helpServicesCategories.map(async (category) => {
      const shortCategory = category.split(".")[1] || category;

      try {
        const response = await axios.get(
          `https://api.geoapify.com/v2/places?categories=${category}&${
            place_id ? `filter=place:${place_id}` : ""
          }&bias=proximity:${lon},${lat}&limit=20&apiKey=${geoapify_api_key}`
        );

        const features = response.data.features || [];

        helpServicesResults[shortCategory] = features.map((f: any) => ({
          name: f.properties.name,
          address: f.properties.formatted,
          lat: f.properties.lat,
          lon: f.properties.lon,
          mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.properties.name + ' ' + f.properties.formatted)}`,
          distance: f.properties.distance || null,
          rating: f.properties.rank_confidence || null,
          category: category,
        }));
      } catch (error: any) {
        console.error(`Error fetching ${shortCategory}: ${error.message}`);
        helpServicesResults[shortCategory] = [];
      }
    })
  );

  return helpServicesResults;
};

// Mastra Tool Definition
export const geoapifyPlacesTool = createTool({
  id: "geoapify-places-tool",
  description:
    "Find nearby places (like hotels, clubs, gas stations) based on user query and location using Geoapify APIs.",
  inputSchema: z.object({
    address: z.string().describe("Address or city name to search around."),
    categories: z
      .array(z.string())
      .optional()
      .describe("Array of Geoapify category keys determined by the LLM."),
  }),
  outputSchema: z.record(
    z.string(),
    z.array(
      z.object({
        name: z.string().nullable(),
        address: z.string().nullable(),
        lat: z.number().nullable(),
        lon: z.number().nullable(),
        mapsUrl: z.string().nullable(),
        distance: z.number().nullable(),
        rating: z.number().nullable(),
        category: z.string().nullable(),
      })
    )
  ),
  execute: async ({ context }) => {
    const { address, categories } = context;
    return await nearbyHelpService(address, categories || []);
  },
});
