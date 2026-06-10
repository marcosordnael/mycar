import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSelectedVehicleId, setSelectedVehicleId } from '../database/repositories/settingsRepository';
import { getVehicleById, getVehicles } from '../database/repositories/vehicleRepository';
import { Vehicle } from '../types';

interface SelectedVehicleContextValue {
  selectedVehicle: Vehicle | null;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  refreshSelectedVehicle: () => void;
}

const SelectedVehicleContext = createContext<SelectedVehicleContextValue | undefined>(undefined);

export const SelectedVehicleProvider = ({ children }: { children: ReactNode }) => {
  const [selectedVehicle, setSelectedVehicleState] = useState<Vehicle | null>(null);

  const refreshSelectedVehicle = useCallback(() => {
    const vehicles = getVehicles();

    if (vehicles.length === 0) {
      setSelectedVehicleId(null);
      setSelectedVehicleState(null);
      return;
    }

    const storedVehicleId = getSelectedVehicleId();
    const storedVehicle = storedVehicleId ? getVehicleById(storedVehicleId) : null;
    const nextVehicle = storedVehicle ?? vehicles[0];

    if (nextVehicle.id !== storedVehicleId) {
      setSelectedVehicleId(nextVehicle.id);
    }

    setSelectedVehicleState(nextVehicle);
  }, []);

  const setSelectedVehicle = useCallback((vehicle: Vehicle | null) => {
    setSelectedVehicleId(vehicle?.id ?? null);
    setSelectedVehicleState(vehicle);
  }, []);

  useEffect(() => {
    refreshSelectedVehicle();
  }, [refreshSelectedVehicle]);

  const value = useMemo(
    () => ({
      selectedVehicle,
      setSelectedVehicle,
      refreshSelectedVehicle,
    }),
    [refreshSelectedVehicle, selectedVehicle, setSelectedVehicle]
  );

  return (
    <SelectedVehicleContext.Provider value={value}>
      {children}
    </SelectedVehicleContext.Provider>
  );
};

export const useSelectedVehicle = (): SelectedVehicleContextValue => {
  const context = useContext(SelectedVehicleContext);

  if (!context) {
    throw new Error('useSelectedVehicle must be used within SelectedVehicleProvider');
  }

  return context;
};
