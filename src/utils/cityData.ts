import { CityData } from '../types/quiz';

export const cityData: CityData = {
  milwaukee: {
    primary: "Milwaukee",
    suburbs: ["Wauwatosa", "West Allis", "Brookfield", "New Berlin", "Franklin", "Oak Creek"],
    population: 590157,
    serviceRadius: 25,
    avgTicket: 7500  // More realistic for Milwaukee market
  },
  madison: {
    primary: "Madison", 
    suburbs: ["Middleton", "Fitchburg", "Verona", "Sun Prairie", "Waunakee", "McFarland"],
    population: 269840,
    serviceRadius: 20,
    avgTicket: 8000  // Slightly higher for Madison market
  },
  greenbay: {
    primary: "Green Bay",
    suburbs: ["De Pere", "Ashwaubenon", "Allouez", "Bellevue", "Howard", "Suamico"],
    population: 107395,
    serviceRadius: 30,
    avgTicket: 7000  // More conservative for smaller market
  }
};

export const getAllCities = (): string[] => {
  const cities: string[] = [];
  Object.values(cityData).forEach(metro => {
    cities.push(metro.primary);
    cities.push(...metro.suburbs);
  });
  return cities.sort();
};

const DEFAULT_AVG_TICKET = 10000;

// Resolve average ticket by matching the primary city or any suburb (case-insensitive)
export const getAvgTicketForCity = (city?: string): number => {
  if (!city) return DEFAULT_AVG_TICKET;
  const needle = city.split(',')[0].trim().toLowerCase();
  for (const metro of Object.values(cityData)) {
    if (metro.primary.toLowerCase() === needle) return metro.avgTicket ?? DEFAULT_AVG_TICKET;
    if (metro.suburbs.map(s => s.toLowerCase()).includes(needle)) return metro.avgTicket ?? DEFAULT_AVG_TICKET;
  }
  return DEFAULT_AVG_TICKET;
};
