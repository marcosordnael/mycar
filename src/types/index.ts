export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  plate: string;
  currentMileage?: number;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: number;
  vehicleId: number;
  serviceType: string;
  date: string;
  mileage: number;
  cost: number;
  notes: string;
  nextRevisionDate?: string;
  nextRevisionMileage?: number;
  createdAt: string;
}

export interface FipeBrand {
  code: string;
  name: string;
}

export interface FipeYear {
  code: string;
  name: string;
}

export interface FipeModel {
  code: string;
  name: string;
}
