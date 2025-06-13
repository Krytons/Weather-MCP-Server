import { WeatherService } from "../services/WeatherService";
import { CurrentWeatherToolParameters } from "../types/CurrentWeather";
import { CurrentWeatherToolSchema } from "../schemas/WeatherSchemas";
import { TextContent } from "../types/Content";

export class WeatherTools {
    WeatherService: WeatherService;

    constructor() {
        //STEP 1 -- Setup the WeatherService with the API key from environment variables
        this.WeatherService = new WeatherService(process.env.API_KEY || '');
    }

    /**
     * This method retrieves the current weather for a specified city.
     * @param params - The parameters for the current weather tool, including the city name.
     * @returns A promise that resolves to a TextContent object containing the weather information.
     * @throws An error if the weather data cannot be retrieved.
     */
    async getCurrentWeather (params: CurrentWeatherToolParameters) : Promise<TextContent> {
        try {
            const weatherToolResponse = await this.WeatherService.getCurrentWeather(params.city);
            return {
                content : [
                    {
                        type: 'text',
                        text: JSON.stringify(weatherToolResponse, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content : [
                    {
                        type: 'text',
                        text: `Error retrieving data. ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ]
            };
        }
    }

    /**
     * This method returns the tools available in the WeatherTools class.
     * @returns An array of tool objects, each containing the tool name, description, schema, and handler.
     */
    getTools() {
        return [
            {
                toolName: "getCurrentWeather",
                toolDescription: "Get the current weather for a specified city",
                toolSchema: CurrentWeatherToolSchema,
                toolHandler: this.getCurrentWeather.bind(this)
            }
        ];
    }
}
