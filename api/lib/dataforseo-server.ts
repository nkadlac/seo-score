import { SEORanking } from '../../src/types/quiz';

interface DataForSEOConfig {
  login: string;
  password: string;
  baseUrl: string;
}

interface DataForSEOSearchVolumeResult {
  keyword: string;
  location_code: number;
  language_code: string;
  search_partners: boolean;
  competition: string;
  competition_index: number;
  search_volume: number;
  low_top_of_page_bid: number;
  high_top_of_page_bid: number;
  cpc: number;
  monthly_searches: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
}

/**
 * Server-side DataForSEO service (Node.js compatible)
 */
export class DataForSEOServerService {
  private config: DataForSEOConfig;

  constructor(login: string, password: string) {
    this.config = {
      login,
      password,
      baseUrl: 'https://api.dataforseo.com/v3'
    };
  }

  /**
   * Get search volume data for multiple keywords
   */
  async getSearchVolumes(keywords: string[], locationCode: number = 2840): Promise<Record<string, number>> {
    try {
      const response = await this.makeRequest('/keywords_data/google_ads/search_volume/live', [{
        location_code: locationCode,
        keywords: keywords,
        language_code: 'en',
        search_partners: false
      }]);

      const volumes: Record<string, number> = {};
      if (response.tasks?.[0]?.result) {
        response.tasks[0].result.forEach((item: DataForSEOSearchVolumeResult) => {
          volumes[item.keyword] = item.search_volume || 0;
        });
      }

      return volumes;
    } catch (error) {
      console.error('Failed to get search volumes:', error);
      return {};
    }
  }

  /**
   * Get local pack rankings for a specific keyword and location
   */
  async getLocalPackRankings(keyword: string, location: string, businessPlaceId?: string, businessDomain?: string): Promise<{
    mapPackPosition: number | null;
    organicPosition: number | null;
  }> {
    try {
      const locationCode = await this.getLocationCode(location);
      
      const response = await this.makeRequest('/serp/google/organic/live/regular', [{
        keyword,
        location_code: locationCode,
        language_code: 'en',
        device: 'desktop',
        os: 'windows'
      }]);

      let mapPackPosition: number | null = null;
      let organicPosition: number | null = null;

      if (response.tasks?.[0]?.result?.[0]?.items) {
        const items = response.tasks[0].result[0].items;
        
        for (const item of items) {
          if (item.type === 'map') {
            if (item.items) {
              for (let i = 0; i < item.items.length; i++) {
                const mapItem = item.items[i];
                if (businessPlaceId && mapItem.place_id === businessPlaceId) {
                  mapPackPosition = i + 1;
                  break;
                }
              }
            }
          }
          
          if (item.type === 'organic') {
            if (businessDomain && item.domain && item.domain.includes(businessDomain.replace(/^https?:\/\//, '').split('/')[0])) {
              organicPosition = item.rank_absolute;
            }
          }
        }
      }

      return { mapPackPosition, organicPosition };
    } catch (error) {
      console.error(`Failed to get rankings for ${keyword}:`, error);
      return { mapPackPosition: null, organicPosition: null };
    }
  }

  /**
   * Get location code for a city
   */
  private async getLocationCode(location: string): Promise<number> {
    try {
      const city = location.split(',')[0].trim();
      
      // Use GET request to fetch all US locations and find the city
      const response = await fetch(`${this.config.baseUrl}/keywords_data/google_ads/locations/US`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.login}:${this.config.password}`).toString('base64')}`
        }
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      
      if (data.tasks?.[0]?.result) {
        // Find city in the results (case insensitive search)
        const cityLocation = data.tasks[0].result.find((loc: any) => 
          loc.location_name.toLowerCase().includes(city.toLowerCase()) && 
          loc.location_type === 'City'
        );
        
        if (cityLocation) {
          return cityLocation.location_code;
        }
        
        // Fallback: find state/region that contains the city
        const stateLocation = data.tasks[0].result.find((loc: any) => 
          loc.location_name.toLowerCase().includes('wisconsin') || 
          loc.location_name.toLowerCase().includes('milwaukee')
        );
        
        if (stateLocation) {
          return stateLocation.location_code;
        }
      }
      
      return 2840; // Default to US
    } catch (error) {
      console.error(`Failed to get location code for ${location}:`, error);
      return 2840;
    }
  }

  /**
   * Make authenticated request to DataForSEO API
   */
  private async makeRequest(endpoint: string, data: any): Promise<any> {
    const auth = Buffer.from(`${this.config.login}:${this.config.password}`).toString('base64');
    
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * Calculate missed leads based on ranking position
 */
export const calculateMissedLeads = (
  searchVolume: number, 
  currentRank: number | null,
  mapPackPosition: number | null
): number => {
  const organicCTR: Record<number, number> = {
    1: 0.284, 2: 0.152, 3: 0.099, 4: 0.067, 5: 0.051,
    6: 0.041, 7: 0.034, 8: 0.028, 9: 0.025, 10: 0.022
  };

  const mapPackCTR: Record<number, number> = {
    1: 0.446, 2: 0.156, 3: 0.098
  };

  let currentLeads = 0;
  
  if (mapPackPosition && mapPackPosition <= 3) {
    currentLeads = searchVolume * (mapPackCTR[mapPackPosition] || 0);
  } else if (currentRank && currentRank <= 10) {
    currentLeads = searchVolume * (organicCTR[currentRank] || 0);
  }

  const potentialLeads = searchVolume * mapPackCTR[1];
  return Math.round(potentialLeads - currentLeads);
};

/**
 * Server-side function to get SEO rankings
 */
export const getSEORankingsServer = async (
  keywords: string[],
  businessPlaceId: string,
  city: string,
  businessDomain?: string
): Promise<SEORanking[]> => {
  const login = process.env.DATAFORSEO_LOGIN || '';
  const password = process.env.DATAFORSEO_PASSWORD || '';
  
  if (!login || !password) {
    throw new Error('DataForSEO credentials not configured');
  }

  const service = new DataForSEOServerService(login, password);
  
  console.log('Getting search volumes for keywords:', keywords);
  const searchVolumes = await service.getSearchVolumes(keywords);
  console.log('Search volumes:', searchVolumes);

  const rankings: SEORanking[] = [];
  
  for (const keyword of keywords) {
    console.log(`Checking rankings for: ${keyword}`);
    const { mapPackPosition, organicPosition } = await service.getLocalPackRankings(
      keyword, 
      city, 
      businessPlaceId,
      businessDomain
    );
    
    const searchVolume = searchVolumes[keyword] || 0;
    const missedLeadsPerMonth = calculateMissedLeads(searchVolume, organicPosition, mapPackPosition);
    
    rankings.push({
      keyword,
      searchVolume,
      currentRank: organicPosition,
      mapPackPosition,
      missedLeadsPerMonth,
      isServiceKeyword: !keyword.includes('garage flooring') && !keyword.includes('concrete sealing')
    });
  }
  
  console.log('Final SEO rankings:', rankings);
  return rankings;
};
