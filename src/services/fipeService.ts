import { FipeBrand, FipeModel, FipeYear } from '../types';

const BASE_URL = 'https://parallelum.com.br/fipe/api/v2/cars';

export const fetchCarBrands = async (): Promise<FipeBrand[]> => {
  try {
    const response = await fetch(`${BASE_URL}/brands`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching car brands:', error);
    return [];
  }
};

export const fetchCarModelsByBrand = async (brandId: string): Promise<FipeModel[]> => {
  try {
    const response = await fetch(`${BASE_URL}/brands/${brandId}/models`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching models for brand ${brandId}:`, error);
    return [];
  }
};

export const fetchCarYearsByBrandAndModel = async (brandId: string, modelId: string): Promise<FipeYear[]> => {
  try {
    const response = await fetch(`${BASE_URL}/brands/${brandId}/models/${modelId}/years`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching years for brand ${brandId} and model ${modelId}:`, error);
    return [];
  }
};
