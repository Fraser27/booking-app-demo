import config from '../config.json';

interface SearchFilters {
  location?: string;
  price_per_night?: {
    min: number;
    max: number;
  };
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string;
}

interface SearchResponse {
  properties: Array<{
    id: string;
    title: string;
    description: string;
    location: string;
    price_per_night: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    image_url: string;
  }>;
  total: number;
}

export const searchProperties = async (query: string, filters: SearchFilters, token: string): Promise<SearchResponse> => {
  try {
    const response = await fetch(`${config.apiUrl}/properties/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        query,
        filters
      })
    });

    if (!response.ok) {
      throw new Error('Failed to search properties');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching properties:', error);
    throw error;
  }
}; 