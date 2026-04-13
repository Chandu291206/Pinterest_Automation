export interface Campaign {
  id: string;
  name: string;
  theme: string;
  amazon_keywords: string[];
  posts_per_day: number;
  posting_hours: number[];
  board_id: string;
  status: string;
  created_at: string;
}

export interface AffiliateLink {
  id: string;
  campaign_id: string;
  asin: string;
  product_name: string;
  product_category: string | null;
  affiliate_url: string;
  image_url: string | null;
  price: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Pin {
  id: string;
  campaign_id: string;
  affiliate_link_id: string;
  title: string;
  description: string;
  hashtags: string[];
  image_url: string | null;
  pinterest_pin_id: string | null;
  pin_format: "single" | "collage";
  variant: string;
  status: string;
  posted_at: string | null;
  impressions: number;
  saves: number;
  clicks: number;
  created_at: string;
}
