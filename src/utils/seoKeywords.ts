import { SEORanking } from '../types/quiz';

/**
 * Comprehensive keyword strategy covering the entire buyer journey
 * Maps quiz services to high-value SEO keywords across multiple intent levels
 */
export const getKeywordsForServices = (services: string[], city: string): string[] => {
  // Clean city name (remove state abbreviation for keyword searches)
  const cleanCity = city.split(',')[0].trim();
  
  // High-Intent Contractor/Service Searches (Highest Conversion)
  const highIntentKeywords = [
    `${cleanCity} garage floor contractors`,
    `concrete coating contractors ${cleanCity}`,
    `epoxy flooring installers ${cleanCity}`,
    `garage floor coating companies ${cleanCity}`,
    `flooring contractors near me`,
    `best concrete coating company ${cleanCity}`
  ];

  // Problem-Based Searches (High Convert - People Need Solutions)
  const problemBasedKeywords = [
    `cracked garage floor repair ${cleanCity}`,
    `garage floor peeling ${cleanCity}`,
    `concrete floor sealing ${cleanCity}`,
    `oil stain garage floor ${cleanCity}`,
    `garage floor makeover ${cleanCity}`,
    `concrete resurfacing ${cleanCity}`
  ];

  // Commercial Keywords (Higher Value Jobs)
  const commercialKeywords = [
    `warehouse floor coating ${cleanCity}`,
    `industrial epoxy flooring ${cleanCity}`,
    `commercial concrete sealing ${cleanCity}`,
    `retail floor coating ${cleanCity}`
  ];

  // Service-Specific Keywords Based on User's Selected Services
  const serviceKeywordMap: Record<string, string[]> = {
    'Polyurea': [
      `polyurea coating ${cleanCity}`,
      `polyurea flooring ${cleanCity}`,
      `polyurea garage floor ${cleanCity}`,
      `polyurea contractors ${cleanCity}`,
      `best polyurea coating ${cleanCity}`
    ],
    'Polyaspartic': [
      `polyaspartic coating ${cleanCity}`,
      `polyaspartic flooring ${cleanCity}`,
      `polyaspartic garage floor ${cleanCity}`,
      `polyaspartic vs epoxy ${cleanCity}`,
      `one day garage floor ${cleanCity}`
    ],
    'Decorative Concrete': [
      `decorative concrete ${cleanCity}`,
      `stamped concrete ${cleanCity}`,
      `decorative concrete flooring ${cleanCity}`,
      `concrete staining ${cleanCity}`,
      `decorative garage floors ${cleanCity}`
    ],
    'Epoxy': [
      `epoxy flooring ${cleanCity}`,
      `epoxy garage floor ${cleanCity}`,
      `epoxy coating ${cleanCity}`,
      `garage epoxy installers ${cleanCity}`,
      `residential epoxy flooring ${cleanCity}`
    ]
  };

  // Research/Comparison Keywords (Early Buyer Journey)
  const researchKeywords = [
    `garage floor coating cost ${cleanCity}`,
    `epoxy vs polyurea flooring ${cleanCity}`,
    `best garage floor coating ${cleanCity}`,
    `garage floor options ${cleanCity}`,
    `durable garage flooring ${cleanCity}`
  ];

  // Always include high-impact baseline keywords
  const coreKeywords = [
    ...highIntentKeywords.slice(0, 3), // Top 3 contractor searches
    ...problemBasedKeywords.slice(0, 3), // Top 3 problem searches
    ...commercialKeywords.slice(0, 2), // Top 2 commercial searches
    ...researchKeywords.slice(0, 2) // Top 2 research searches
  ];

  // Add service-specific keywords based on selected services
  const selectedServiceKeywords: string[] = [];
  services.forEach(service => {
    if (serviceKeywordMap[service]) {
      // Add top 2-3 keywords per selected service
      selectedServiceKeywords.push(...serviceKeywordMap[service].slice(0, 3));
    }
  });

  // Combine all keywords (15-20 total for comprehensive analysis)
  return [...coreKeywords, ...selectedServiceKeywords];
};

/**
 * Calculates estimated missed leads per month based on ranking position
 */
export const calculateMissedLeads = (
  searchVolume: number, 
  currentRank: number | null,
  mapPackPosition: number | null
): number => {
  // CTR (Click Through Rate) estimates based on position
  const organicCTR: Record<number, number> = {
    1: 0.284, // 28.4% for #1 organic
    2: 0.152, // 15.2% for #2 organic
    3: 0.099, // 9.9% for #3 organic
    4: 0.067,
    5: 0.051,
    6: 0.041,
    7: 0.034,
    8: 0.028,
    9: 0.025,
    10: 0.022
  };

  // Map pack gets much higher CTR (local searches)
  const mapPackCTR: Record<number, number> = {
    1: 0.446, // 44.6% for #1 in map pack
    2: 0.156, // 15.6% for #2 in map pack  
    3: 0.098  // 9.8% for #3 in map pack
  };

  let currentLeads = 0;
  
  // Calculate current leads based on position
  if (mapPackPosition && mapPackPosition <= 3) {
    currentLeads = searchVolume * (mapPackCTR[mapPackPosition] || 0);
  } else if (currentRank && currentRank <= 10) {
    currentLeads = searchVolume * (organicCTR[currentRank] || 0);
  }

  // Calculate potential leads if they were #1 in map pack
  const potentialLeads = searchVolume * mapPackCTR[1];
  
  return Math.round(potentialLeads - currentLeads);
};

/**
 * Determines priority level of a keyword based on service selection and search volume
 */
export const getKeywordPriority = (
  keyword: string, 
  services: string[], 
  searchVolume: number
): 'high' | 'medium' | 'low' => {
  // High priority: selected services with good volume
  const isServiceKeyword = services.some(service => 
    keyword.toLowerCase().includes(service.toLowerCase().replace(' ', ''))
  );
  
  if (isServiceKeyword && searchVolume >= 300) return 'high';
  if (searchVolume >= 500) return 'high'; // High volume baseline keywords
  if (searchVolume >= 200) return 'medium';
  return 'low';
};

/**
 * Gets estimated search volumes for keywords (placeholder - would be replaced with real API)
 */
export const getEstimatedSearchVolume = (keyword: string): number => {
  // This is placeholder data - in production, this would call DataForSEO or similar API
  const volumeEstimates: Record<string, number> = {
    'garage flooring': 450,
    'concrete sealing': 320,
    'garage floor coating': 280,
    'polyurea coating': 380,
    'polyurea flooring': 240,
    'polyaspartic coating': 290,
    'polyaspartic flooring': 180,
    'decorative concrete': 520,
    'stamped concrete': 720,
    'epoxy flooring': 680,
    'epoxy garage floor': 410,
    'epoxy coating': 350
  };

  // Extract base keyword (remove city)
  const baseKeyword = keyword.split(' ').slice(0, -1).join(' ');
  
  // Apply city modifier (smaller cities = lower volume)
  let volume = volumeEstimates[baseKeyword] || 150;
  
  // City size modifiers (placeholder logic)
  if (keyword.includes('milwaukee') || keyword.includes('chicago')) {
    volume *= 1.3; // Major cities get 30% boost
  } else if (keyword.includes('green bay') || keyword.includes('madison')) {
    volume *= 0.8; // Smaller cities get 20% reduction
  }

  return Math.round(volume);
};

/**
 * Get real SEO rankings using DataForSEO API via backend endpoint
 */
export const checkSEORankings = async (
  keywords: string[], 
  businessPlaceId: string,
  city: string = 'Milwaukee, WI'
): Promise<SEORanking[]> => {
  try {
    if (import.meta.env.DEV) console.log('Calling SEO rankings API...');
    const response = await fetch('/api/seo-rankings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords,
        businessPlaceId,
        city
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.rankings) {
      if (import.meta.env.DEV) console.log('Real SEO rankings received:', data.rankings);
      return data.rankings;
    } else {
      throw new Error(data.error || 'Invalid API response');
    }

  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to get real SEO rankings, falling back to mock data:', error);
    
    // Fallback to mock data if API fails
    return keywords.map((keyword) => {
      const searchVolume = getEstimatedSearchVolume(keyword);
      
      // Mock some rankings (fallback)
      const currentRank = Math.random() > 0.6 ? Math.floor(Math.random() * 10) + 1 : null;
      const mapPackPosition = Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 1 : null;
      
      return {
        keyword,
        searchVolume,
        currentRank,
        mapPackPosition,
        missedLeadsPerMonth: calculateMissedLeads(searchVolume, currentRank, mapPackPosition),
        isServiceKeyword: !keyword.includes('garage flooring') && !keyword.includes('concrete sealing')
      };
    });
  }
};
