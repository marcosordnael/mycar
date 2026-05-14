import { withDbRecovery } from '../db';

export const getSelectedVehicleId = (): number | null => {
  return withDbRecovery((db) => {
    const row = db.getFirstSync<{ selectedVehicleId: number | null }>('SELECT selectedVehicleId FROM app_settings WHERE id = 1');
    return row?.selectedVehicleId ?? null;
  });
};

export const setSelectedVehicleId = (vehicleId: number | null): void => {
  withDbRecovery((db) => {
    db.runSync('UPDATE app_settings SET selectedVehicleId = ? WHERE id = 1', vehicleId);
  });
};
