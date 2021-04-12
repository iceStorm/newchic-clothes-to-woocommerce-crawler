export interface DetailResult {
  galleryImages: string;
  variants: Clothes[];
}

export interface Clothes {
  Type: string;
  Categories: string;
  SKU: string;
  Name: string;
  Published: 1;
  Stock?: number;
  'Visibility in catalog': string;
  'In stock?': 1;
  'Regular price'?: number;
  'Sale price'?: number;
  
  Parent?: string;
  'Attribute 1 name': string;
  'Attribute 1 value(s)'?: string;
  'Attribute 1 visible'?: 1;
  'Attribute 1 global'?: 1;

  'Attribute 2 name'?: string;
  'Attribute 2 value(s)'?: string;
  'Attribute 2 visible'?: 1;
  'Attribute 2 global'?: 1;
  Images: string;
}

