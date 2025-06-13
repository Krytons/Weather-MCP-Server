import {z} from "zod";

export const CurrentWeatherToolSchema = z.object({
  city: z.string().describe("The name of the city to get the current weather for"),
});