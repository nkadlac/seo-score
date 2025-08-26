export interface BusinessData {
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

export interface SEORanking {
  keyword: string;
  searchVolume: number;
  currentRank: number | null; // null if not in top 10
  mapPackPosition: number | null; // 1-3 if in map pack
  missedLeadsPerMonth: number; // calculated estimate
  isServiceKeyword: boolean; // true if tied to selected service
}

export interface SEOIntelligence {
  rankings: SEORanking[];
  totalMissedLeads: number;
  topOpportunity: string; // highest volume keyword they're missing
}

export interface QuizAnswers {
  fullName: string;
  businessName: string;
  city: string;
  services: string[];
  radius: number;
  responseTime: number; // minutes
  smsCapability: 'both' | 'text-back' | 'autoresponder' | 'neither';
  premiumPages: 'all' | 'some' | 'none';
  reviewCount: number;
  // Sales intelligence data (not displayed to user yet)
  businessData?: BusinessData;
  seoIntelligence?: SEOIntelligence;
}

export interface ScoreResult {
  score: number;
  band: ScoreBand;
  forecast: string;
  guaranteeStatus: string;
  topMoves: string[];
}

export type ScoreBand = 'green' | 'yellow' | 'orange' | 'red';

export interface CityData {
  [metro: string]: {
    primary: string;
    suburbs: string[];
    population: number;
    serviceRadius: number;
    coordinates?: [number, number];
  };
}

export interface CloseWebhookPayload {
  contact: {
    name: string;
    emails: [{ email: string; type: 'office' }];
    phones?: [{ phone: string; type: 'office' }];
  };
  custom: {
    business_city: string;
    priority_services: string[];
    service_radius: number;
    response_speed: string;
    sms_capability: string;
    premium_pages: string;
    review_velocity: string;
    pipeline_score: number;
    score_band: string;
    top_moves: string[];
    // GBP Intelligence Data
    gbp_rating?: number;
    gbp_review_count?: number;
    gbp_phone?: string;
    gbp_website?: string;
    gbp_place_id?: string;
    gbp_address?: string;
    // SEO Intelligence Data
    seo_missed_leads?: number;
    seo_top_opportunity?: string;
    seo_map_pack_rankings?: number;
    seo_keyword_count?: number;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
  tags: string[];
}

export interface KitWebhookPayload {
  email: string;
  tags: string[];
  fields: {
    score: number;
    city: string;
    full_name: string;
    business_name: string;
    top_move_1: string;
    guarantee_status: string;
    // GBP Intelligence
    gbp_rating?: number;
    gbp_review_count?: number;
    gbp_phone?: string;
    gbp_website?: string;
    // SEO Intelligence
    seo_missed_leads?: number;
    seo_top_opportunity?: string;
  };
}