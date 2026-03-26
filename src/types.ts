export interface Property {
  quick_ref: string;
  situs_address: string;
  city: string;
  zip: string;
  prop_class: string;
  year_built: number;
  owner1_name: string;
  owner1_address: string;
  owner2_name: string;
  owner_absentee: boolean;
  billing_name: string;
  noav_curr_appraised: number;
  noav_prev_appraised: number;
  pdf_curr_total: number;
  lat: number;
  lng: number;
  watershed: string;
  elevation_ft: number;
  fire_station_dist_ft: number;
  hydrant_dist_ft: number;
  electric_provider: string;
  gas_provider: string;
  sewer_provider: string;
  water_provider: string;
  sewer_is_public: boolean;
  property_image_url: string;
  pdf_source_url?: string;
  last_scraped_at: string;
  last_sale_date?: string;
  last_sale_price?: number;
  
  // Joined fields
  dwelling?: Dwelling;
  tax?: Tax;
}

export interface Dwelling {
  quick_ref: string;
  pdf_res_type: string;
  pdf_quality: string;
  pdf_year_built: number;
  pdf_style: string;
  pdf_total_sqft: number;
  pdf_bedrooms: number;
  pdf_full_baths: number;
  pdf_half_baths: number;
  pdf_pct_good: number;
  pdf_garage_type: string;
  pdf_basement_sqft: number;
  pdf_fireplace_count: number;
  pdf_dwelling_rcn: number;
  pdf_building_value: number;
}

export interface Tax {
  quick_ref: string;
  tax_year: number;
  tax_full_payment: number;
  tax_mill_levy_rate: number;
  tax_balance_due: number;
  tax_is_delinquent: boolean;
  tax_special_assessments: number;
}

export interface Permit {
  quick_ref: string;
  permit_type: string;
  amount: number;
  issue_date: string;
  status: string;
}

export interface Sale {
  quick_ref: string;
  sale_date: string;
  sale_type: string;
  validity: string;
  sale_price?: number;
}

export interface CompSale {
  quick_ref: string;
  comp_quick_ref: string;
  comp_address: string;
  sale_date: string;
  sale_price: number;
}

export interface AppraisalHistory {
  quick_ref: string;
  year: number;
  appraised: number;
}

export interface PropertyPhoto {
  quick_ref: string;
  photo_url: string;
  photo_date: string;
  is_primary: boolean;
  sequence: number;
}

export interface PropertyEvent {
  quick_ref: string;
  event_type: string;
  occurred_at: string;
  summary: string;
}
