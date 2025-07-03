import { CurrentWeatherServiceResponse, CurrentWeatherToolResponse } from "../types/CurrentWeather";

import Debug from "debug";
const infoLogger = Debug("WeatherService:log");
const errorLogger = Debug("WeatherService:error");

export class WeatherService {
    public static instance: WeatherService;

    private API_KEY: string;
    private BASE_URL: string;
    private ENDPOINTS = {
        current: 'weather?q={city}&appid={API_KEY}',
    }

    
    private constructor(apiKey: string) {
        if(!apiKey || apiKey.trim() === '')
            throw new Error('API key is required');

        this.API_KEY = apiKey;
        this.BASE_URL = 'https://api.openweathermap.org/data/2.5';

        this.getCurrentWeather = this.getCurrentWeather.bind(this);
    }


    public static getInstance(apiKey: string): WeatherService {
        if (!WeatherService.instance) 
            WeatherService.instance = new WeatherService(apiKey);
        
        return WeatherService.instance;
    }   


    /**
     * This method retrieves the current weather for a specified city.
     * @param city - The name of the city to get the current weather for.
     * @returns A promise that resolves to a CurrentWeatherToolResponse object containing the weather information.
     * @throws An error if the weather data cannot be retrieved.
     * @throws An error if the API key is not provided or is invalid.
     * @throws An error if the response from the API is not ok.
     * @throws An error if the response cannot be parsed as JSON.
     */
    public getCurrentWeather(city: string): Promise<CurrentWeatherToolResponse> {
        const endpoint = this.ENDPOINTS.current.replace('{city}', city).replace('{API_KEY}', this.API_KEY);
        const url = `${this.BASE_URL}/${endpoint}`;
        infoLogger(`ℹ️ Fetching current weather for city: ${city} using URL: ${url}`);

        return fetch(url)
            .then(response => {
                if (!response.ok) 
                    throw new Error(`Error fetching weather data: ${response.statusText}`);
                return response.json() as Promise<CurrentWeatherServiceResponse>;
            })
            .then((data : CurrentWeatherServiceResponse) => {
                return {
                    temperature: data.main.temp,
                    description: data.weather[0].description,
                    city: data.name,
                } as CurrentWeatherToolResponse;
            })
            .catch((error : Error) => {
                errorLogger('❌ Error: ', error.message);
                throw error;
            });
    }
}