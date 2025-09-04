interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  formatted_phone_number?: string;
  website?: string;
  business_status?: string;
  types: string[];
}

interface BusinessData {
  hasGBP: boolean;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  rating?: number;
  reviewCount?: number;
  phone?: string;
  website?: string;
  placeId?: string;
  coordinates?: { lat: number; lng: number };
}

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

export class GooglePlacesService {
  private autocompleteService: any = null;
  private placesService: any = null;
  private isLoaded = false;

  async initialize(): Promise<boolean> {
    return new Promise((resolve) => {
      if (import.meta.env.DEV) console.log('Initializing Google Places API...');
      
      // Check if Google Places is already loaded
      if (window.google?.maps?.places) {
        if (import.meta.env.DEV) console.log('Google Places API already loaded');
        this.setupServices();
        resolve(true);
        return;
      }

      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (existingScript) {
        if (import.meta.env.DEV) console.log('Google Places script already loading, waiting...');
        // Script is already loading, wait for it
        const checkLoaded = setInterval(() => {
          if (window.google?.maps?.places) {
            if (import.meta.env.DEV) console.log('Google Places API loaded successfully');
            clearInterval(checkLoaded);
            this.setupServices();
            resolve(true);
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if (import.meta.env.DEV) console.log('Google Places API load timeout');
          clearInterval(checkLoaded);
          resolve(false);
        }, 10000);
        return;
      }

      // Load Google Places API
      const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        console.warn('Google Places API key not found. Falling back to static city list.');
        resolve(false);
        return;
      }

      console.log('Google Places API key found:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');

      window.initGooglePlaces = () => {
        if (import.meta.env.DEV) console.log('Google Places API callback triggered');
        this.setupServices();
        resolve(true);
      };

      const script = document.createElement('script');
      const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces&loading=async`;
      console.log('Loading Google Maps script from:', scriptUrl.replace(apiKey, 'API_KEY_HIDDEN'));
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      script.onerror = (error) => {
        console.error('Failed to load Google Places API script:', error);
        console.error('Check: 1) API key is valid, 2) APIs are enabled, 3) Domain is authorized');
        resolve(false);
      };
      document.head.appendChild(script);
      if (import.meta.env.DEV) console.log('Google Places API script added to page');
    });
  }

  private setupServices() {
    if (window.google?.maps?.places) {
      this.autocompleteService = new window.google.maps.places.AutocompleteService();
      this.placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
      this.isLoaded = true;
    }
  }

  async searchBusinesses(query: string): Promise<{ suggestions: string[]; businessData?: BusinessData }> {
    if (import.meta.env.DEV) {
      console.log('searchBusinesses called with query:', query);
      console.log('isLoaded:', this.isLoaded, 'autocompleteService:', !!this.autocompleteService);
    }
    
    // Always return static suggestions immediately if Google Places isn't loaded
    if (!this.isLoaded || !this.autocompleteService) {
      if (import.meta.env.DEV) console.log('Google Places not loaded, using static suggestions');
      return this.getStaticSuggestions(query);
    }

    if (import.meta.env.DEV) console.log('Using Google Places API for search');
    // Use real Google Places API now that Maps JavaScript API is enabled
    return new Promise((resolve) => {
      // Set a reasonable timeout for better UX
      const timeout = setTimeout(() => {
        if (import.meta.env.DEV) console.log('Google Places API timeout, falling back to static suggestions');
        resolve(this.getStaticSuggestions(query));
      }, 2000);

      const request = {
        input: query,
        types: ['establishment'],
        componentRestrictions: { country: 'US' },
      };

      this.autocompleteService.getPlacePredictions(request, (predictions: any[], status: string) => {
        clearTimeout(timeout);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          const suggestions = predictions
            .slice(0, 5)
            .map(p => p.description);
          
          if (import.meta.env.DEV) console.log('Google Places API results:', suggestions);
          
          // Get detailed business data for the first result (most relevant)
          const firstPrediction = predictions[0];
          if (firstPrediction) {
            this.getPlaceDetails(firstPrediction.place_id).then(businessData => {
              if (import.meta.env.DEV) console.log('Business data captured:', businessData);
              resolve({ suggestions, businessData });
            }).catch(() => {
              resolve({ suggestions });
            });
          } else {
            resolve({ suggestions });
          }
        } else {
          if (import.meta.env.DEV) console.log('Google Places API failed with status:', status, 'falling back to static');
          resolve(this.getStaticSuggestions(query));
        }
      });
    });
  }

  private async getPlaceDetails(placeId: string): Promise<BusinessData | undefined> {
    return new Promise((resolve) => {
      const request = {
        placeId,
        fields: [
          'place_id',
          'name',
          'formatted_address',
          'geometry',
          'rating',
          'user_ratings_total',
          'formatted_phone_number',
          'website',
          'business_status',
          'types'
        ]
      };

      this.placesService.getDetails(request, (place: GooglePlaceResult, status: string) => {
        console.log('Google Places getDetails response:', { place, status, place_id: place?.place_id });
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const addressParts = place.formatted_address.split(', ');
          const city = addressParts[addressParts.length - 3] || '';
          const state = addressParts[addressParts.length - 2]?.split(' ')[0] || '';

          const businessData: BusinessData = {
            hasGBP: true,
            name: place.name,
            address: place.formatted_address,
            city: city,
            state: state,
            rating: place.rating,
            reviewCount: place.user_ratings_total,
            phone: place.formatted_phone_number,
            website: place.website,
            placeId: place.place_id,
            coordinates: {
              lat: typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat,
              lng: typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng
            }
          };

          resolve(businessData);
        } else {
          resolve(undefined);
        }
      });
    });
  }

  getStaticSuggestions(query: string): { suggestions: string[]; businessData?: BusinessData } {
    // Regional priority: WI/MN/IL first, then national
    const regionalBusinesses = [
      // Wisconsin (primary market)
      'Premium Coatings Milwaukee - Milwaukee, WI',
      'Elite Epoxy Solutions - Madison, WI',
      'Garage Floor Pros - Milwaukee, WI', 
      'Decorative Concrete Specialists - Green Bay, WI',
      'Milwaukee Garage Floors - Milwaukee, WI',
      'Badger State Coatings - Madison, WI',
      'Superior Flooring Solutions - Green Bay, WI',
      'Concrete Coating Experts - Milwaukee, WI',
      'Pro Coat Solutions - Milwaukee, WI',
      
      // Minnesota (secondary priority)
      'Twin Cities Epoxy - Minneapolis, MN',
      'Minnesota Garage Floors - St. Paul, MN',
      'North Star Coatings - Minneapolis, MN',
      'Duluth Floor Systems - Duluth, MN',
      'Rochester Concrete Pros - Rochester, MN',
      
      // Illinois (secondary priority)  
      'Chicago Concrete Coatings - Chicago, IL',
      'Windy City Floors - Chicago, IL',
      'Aurora Epoxy Solutions - Aurora, IL',
      'Rockford Garage Coatings - Rockford, IL',
      'Peoria Floor Experts - Peoria, IL'
    ];
    
    const nationalBusinesses = [
      // Rest of US
      'Motor City Floors - Detroit, MI',
      'Atlanta Garage Solutions - Atlanta, GA',
      'Dallas Decorative Coatings - Dallas, TX',
      'Phoenix Floor Systems - Phoenix, AZ',
      'Denver Garage Floors - Denver, CO',
      'Seattle Concrete Pros - Seattle, WA',
      'Portland Epoxy Experts - Portland, OR',
      'Miami Floor Coatings - Miami, FL',
      'Tampa Bay Garage Floors - Tampa, FL',
      'Charlotte Concrete Solutions - Charlotte, NC',
      'Nashville Floor Pros - Nashville, TN',
      'Kansas City Coatings - Kansas City, MO',
      'Oklahoma Epoxy Solutions - Oklahoma City, OK',
      'Las Vegas Floor Systems - Las Vegas, NV',
      'San Diego Garage Coatings - San Diego, CA',
      'Sacramento Floor Pros - Sacramento, CA',
      'Boston Concrete Experts - Boston, MA',
      'Philadelphia Garage Solutions - Philadelphia, PA',
      'Virginia Beach Coatings - Virginia Beach, VA',
      'Jacksonville Floor Systems - Jacksonville, FL',
      'Memphis Garage Floors - Memphis, TN',
      'Louisville Epoxy Pros - Louisville, KY',
      'Cincinnati Floor Coatings - Cincinnati, OH',
      'Cleveland Concrete Solutions - Cleveland, OH',
      'Pittsburgh Garage Systems - Pittsburgh, PA',
      'Buffalo Floor Experts - Buffalo, NY',
      'Rochester Epoxy Solutions - Rochester, NY',
      'Albany Concrete Pros - Albany, NY'
    ];

    /* Unused variables commented out
    const regionalCities = [
      // Wisconsin (primary)
      'Milwaukee, WI', 'Madison, WI', 'Green Bay, WI', 'Kenosha, WI', 'Racine, WI', 
      'Appleton, WI', 'Oshkosh, WI', 'Eau Claire, WI', 'Janesville, WI', 'La Crosse, WI',
      
      // Minnesota (secondary)
      'Minneapolis, MN', 'St. Paul, MN', 'Rochester, MN', 'Duluth, MN', 'Bloomington, MN',
      'Plymouth, MN', 'Woodbury, MN', 'Maple Grove, MN', 'Blaine, MN',
      
      // Illinois (secondary)
      'Chicago, IL', 'Aurora, IL', 'Rockford, IL', 'Joliet, IL', 'Naperville, IL',
      'Springfield, IL', 'Peoria, IL', 'Elgin, IL', 'Waukegan, IL'
    ];
    
    const nationalCities = [
      // Rest of major US metros
      'Detroit, MI', 'Grand Rapids, MI', 'Warren, MI', 'Sterling Heights, MI',
      'Indianapolis, IN', 'Fort Wayne, IN', 'Evansville, IN',
      'Columbus, OH', 'Cleveland, OH', 'Cincinnati, OH', 'Toledo, OH',
      'Atlanta, GA', 'Augusta, GA', 'Columbus, GA', 'Savannah, GA',
      'Dallas, TX', 'Houston, TX', 'Austin, TX', 'San Antonio, TX', 'Fort Worth, TX',
      'Phoenix, AZ', 'Tucson, AZ', 'Mesa, AZ', 'Chandler, AZ',
      'Denver, CO', 'Colorado Springs, CO', 'Aurora, CO',
      'Seattle, WA', 'Spokane, WA', 'Tacoma, WA', 'Vancouver, WA',
      'Portland, OR', 'Salem, OR', 'Eugene, OR',
      'Las Vegas, NV', 'Reno, NV', 'Henderson, NV',
      'Los Angeles, CA', 'San Diego, CA', 'San Jose, CA', 'San Francisco, CA',
      'Sacramento, CA', 'Oakland, CA', 'Fresno, CA',
      'Miami, FL', 'Tampa, FL', 'Orlando, FL', 'Jacksonville, FL',
      'Charlotte, NC', 'Raleigh, NC', 'Greensboro, NC',
      'Nashville, TN', 'Memphis, TN', 'Knoxville, TN',
      'Kansas City, MO', 'St. Louis, MO', 'Springfield, MO',
      'Oklahoma City, OK', 'Tulsa, OK',
      'Boston, MA', 'Worcester, MA', 'Springfield, MA',
      'Philadelphia, PA', 'Pittsburgh, PA', 'Allentown, PA',
      'Virginia Beach, VA', 'Norfolk, VA', 'Richmond, VA',
      'Louisville, KY', 'Lexington, KY',
      'Buffalo, NY', 'Rochester, NY', 'Syracuse, NY', 'Albany, NY'
    ];
    */

    // Combine with regional priority (unused variables removed)

    // If query looks like it might be a business name (contains letters, not just city)
    if (query.length > 2) {
      // First, look for regional matches
      const regionalMatches = regionalBusinesses
        .filter(business => business.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3);
      
      // Then look for national matches to fill remaining slots
      const nationalMatches = nationalBusinesses
        .filter(business => business.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5 - regionalMatches.length);
      
      const matchingBusinesses = [...regionalMatches, ...nationalMatches];
      
      // If we found matching businesses, return them
      if (matchingBusinesses.length > 0) {
        return { suggestions: matchingBusinesses };
      }
      
      // Otherwise, show their exact input with different locations
      const dynamicSuggestions = [
        `${query} - Milwaukee, WI`,
        `${query} - Minneapolis, MN`, 
        `${query} - Chicago, IL`,
        `${query} - Madison, WI`,
        `${query} - St. Paul, MN`
      ];
      
      return { suggestions: dynamicSuggestions };
    }

    // For short queries, show popular business names with regional priority
    if (query.length > 0) {
      const regionalMatches = regionalBusinesses
        .filter(business => business.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3);
      
      const nationalMatches = nationalBusinesses
        .filter(business => business.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5 - regionalMatches.length);
      
      const popularBusinesses = [...regionalMatches, ...nationalMatches];
      
      if (popularBusinesses.length > 0) {
        return { suggestions: popularBusinesses };
      }
    }

    // Default: show regional businesses first
    return { suggestions: regionalBusinesses.slice(0, 5) };
  }

  // Helper method to determine if a business likely does flooring/coatings
  isFlooringBusiness(businessData: BusinessData): boolean {
    if (!businessData.name) return false;
    
    const flooringKeywords = [
      'floor', 'coating', 'concrete', 'epoxy', 'polyurea', 'polyaspartic',
      'decorative', 'garage', 'basement', 'contractor', 'construction'
    ];

    const name = businessData.name.toLowerCase();
    return flooringKeywords.some(keyword => name.includes(keyword));
  }
}

export const googlePlacesService = new GooglePlacesService();
