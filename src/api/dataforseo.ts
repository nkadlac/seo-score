import { SEORanking } from '../types/quiz';

interface DataForSEOConfig {
  login: string;
  password: string;
  baseUrl: string;
}

interface DataForSEOLocalPackResult {
  keyword: string;
  location_code: number;
  language_code: string;
  items: Array<{
    type: string;
    rank_group: number;
    rank_absolute: number;
    position: string;
    xpath: string;
    domain: string;
    title: string;
    url: string;
    description: string;
    phone?: string;
    address?: string;
    rating?: {
      rating_type: string;
      value: number;
      votes_count: number;
    };
    place_id?: string;
  }>;
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
 * DataForSEO API integration service
 * This should be called from your backend, not frontend (API keys should be server-side)
 */
export class DataForSEOService {
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
      const response = await this.makeRequest('/keywords_data/google_ads/search_volume/post', {
        data: keywords.map(keyword => ({
          keyword,
          location_code: locationCode, // 2840 = United States
          language_code: 'en',
          search_partners: false
        }))
      });

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
  async getLocalPackRankings(keyword: string, location: string, businessPlaceId?: string): Promise<{
    mapPackPosition: number | null;
    organicPosition: number | null;
  }> {
    try {
      // Get location code for the city
      const locationCode = await this.getLocationCode(location);
      
      const response = await this.makeRequest('/serp/google/organic/post', {
        data: [{
          keyword,
          location_code: locationCode,
          language_code: 'en',
          device: 'desktop',
          os: 'windows'
        }]
      });

      let mapPackPosition: number | null = null;
      let organicPosition: number | null = null;

      if (response.tasks?.[0]?.result?.[0]?.items) {
        const items = response.tasks[0].result[0].items;
        
        // Look through results to find the business
        for (const item of items) {
          // Check if this is a map pack result
          if (item.type === 'map') {
            if (item.items) {
              for (let i = 0; i < item.items.length; i++) {
                const mapItem = item.items[i];
                if (businessPlaceId && mapItem.place_id === businessPlaceId) {
                  mapPackPosition = i + 1; // 1-indexed
                  break;
                }
              }
            }
          }
          
          // Check if this is an organic result
          if (item.type === 'organic' && businessPlaceId) {
            // Match by domain or other identifiers (this is simplified)
            if (item.domain && item.domain.includes(businessPlaceId.substring(0, 10))) {
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
   * Get location code for a city (required by DataForSEO)
   */
  private async getLocationCode(location: string): Promise<number> {
    try {
      // Clean location (remove state if present)
      const city = location.split(',')[0].trim();
      
      const response = await this.makeRequest('/keywords_data/google_ads/locations/get', {
        data: [{
          location_name: city,
          country_code: 'US'
        }]
      });

      if (response.tasks?.[0]?.result?.[0]?.location_code) {
        return response.tasks[0].result[0].location_code;
      }
      
      // Default to US if city not found
      return 2840;
    } catch (error) {
      console.error(`Failed to get location code for ${location}:`, error);
      return 2840; // Default to US
    }
  }

  /**
   * Make authenticated request to DataForSEO API
   */
  private async makeRequest(endpoint: string, data: any): Promise<any> {
    const auth = btoa(`${this.config.login}:${this.config.password}`);
    
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
 * Main function to get real SEO rankings using DataForSEO
 * This replaces the mock checkSEORankings function
 */
export const getDataForSEORankings = async (
  keywords: string[],
  businessPlaceId: string,
  city: string
): Promise<SEORanking[]> => {
  // These credentials should be loaded from environment variables in your backend
  const login = process.env.DATAFORSEO_LOGIN || '';
  const password = process.env.DATAFORSEO_PASSWORD || '';
  
  if (!login || !password) {
    console.error('DataForSEO credentials not configured');
    throw new Error('DataForSEO credentials not configured');
  }

  const service = new DataForSEOService(login, password);
  
  try {
    console.log('Getting search volumes for keywords:', keywords);
    const searchVolumes = await service.getSearchVolumes(keywords);
    console.log('Search volumes:', searchVolumes);

    const rankings: SEORanking[] = [];
    
    // Get rankings for each keyword
    for (const keyword of keywords) {
      console.log(`Checking rankings for: ${keyword}`);
      const { mapPackPosition, organicPosition } = await service.getLocalPackRankings(
        keyword, 
        city, 
        businessPlaceId
      );
      
      const searchVolume = searchVolumes[keyword] || 0;
      
      // Calculate missed leads (using the same function from seoKeywords.ts)
      const { calculateMissedLeads } = await import('../utils/seoKeywords');
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
  } catch (error) {
    console.error('Failed to get DataForSEO rankings:', error);
    throw error;
  }
};