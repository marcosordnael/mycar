import * as SQLite from 'expo-sqlite';

const DB_NAME = 'mycar.db';

let dbConnection: SQLite.SQLiteDatabase | null = null;
let schemaInitialized = false;

const openConnection = (): SQLite.SQLiteDatabase => {
  return SQLite.openDatabaseSync(DB_NAME);
};

const getOrOpenConnection = (): SQLite.SQLiteDatabase => {
  if (!dbConnection) {
    dbConnection = openConnection();
  }
  return dbConnection;
};

const isRecoverableSQLiteError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('NativeDatabase.prepareSync') ||
    message.includes('NullPointerException') ||
    message.includes('Access to closed resource')
  );
};

const initializeSchema = (db: SQLite.SQLiteDatabase): void => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS vehicle (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      plate TEXT NOT NULL,
      currentMileage INTEGER,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      selectedVehicleId INTEGER,
      FOREIGN KEY (selectedVehicleId) REFERENCES vehicle (id) ON DELETE SET NULL
    );

    -- Ensure we have exactly one settings row
    INSERT OR IGNORE INTO app_settings (id, selectedVehicleId) VALUES (1, NULL);

    CREATE TABLE IF NOT EXISTS maintenance_record (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicleId INTEGER NOT NULL,
      serviceType TEXT NOT NULL,
      date TEXT NOT NULL,
      mileage INTEGER NOT NULL,
      cost REAL NOT NULL,
      notes TEXT,
      nextRevisionDate TEXT,
      nextRevisionMileage INTEGER,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (vehicleId) REFERENCES vehicle (id) ON DELETE CASCADE
    );
  `);

  // Migration para adicionar colunas caso o banco já exista
  try {
    db.execSync('ALTER TABLE vehicle ADD COLUMN currentMileage INTEGER;');
  } catch (e) {
    // Coluna já existe
  }
  try {
    db.execSync('ALTER TABLE maintenance_record ADD COLUMN nextRevisionDate TEXT;');
  } catch (e) {
    // Coluna já existe
  }
  try {
    db.execSync('ALTER TABLE maintenance_record ADD COLUMN nextRevisionMileage INTEGER;');
  } catch (e) {
    // Coluna já existe
  }
};

export const closeDbConnection = (): void => {
  if (!dbConnection) {
    return;
  }

  try {
    dbConnection.closeSync();
  } catch (error) {
    console.warn('Could not close SQLite connection cleanly:', error);
  }

  dbConnection = null;
  schemaInitialized = false;
};

export const initDb = (): void => {
  if (schemaInitialized) {
    return;
  }

  const db = getOrOpenConnection();
  initializeSchema(db);
  schemaInitialized = true;
};

export const getDb = (): SQLite.SQLiteDatabase => {
  initDb();
  return getOrOpenConnection();
};

export const withDbRecovery = <T>(operation: (db: SQLite.SQLiteDatabase) => T): T => {
  try {
    return operation(getDb());
  } catch (error) {
    if (!isRecoverableSQLiteError(error)) {
      throw error;
    }

    console.warn('SQLite connection was reset after a native error. Retrying once...');
    closeDbConnection();
    initDb();
    return operation(getDb());
  }
};
