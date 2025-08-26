import { CityData } from '../types/quiz';

export const cityData: CityData = {
  milwaukee: {
    primary: "Milwaukee",
    suburbs: ["Wauwatosa", "West Allis", "Brookfield", "New Berlin", "Franklin", "Oak Creek"],
    population: 590157,
    serviceRadius: 25
  },
  madison: {
    primary: "Madison", 
    suburbs: ["Middleton", "Fitchburg", "Verona", "Sun Prairie", "Waunakee", "McFarland"],
    population: 269840,
    serviceRadius: 20
  },
  greenbay: {
    primary: "Green Bay",
    suburbs: ["De Pere", "Ashwaubenon", "Allouez", "Bellevue", "Howard", "Suamico"],
    population: 107395,
    serviceRadius: 30
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