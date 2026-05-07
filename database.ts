import * as SQLite from 'expo-sqlite';

// Función para inicializar la base de datos
export const initDB = async () => {
  const db = await SQLite.openDatabaseAsync('ubicaciones.db');
  
  // Habilitamos el modo WAL (Write-Ahead Logging) para mejor rendimiento
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    DROP TABLE IF EXISTS ubicaciones;
    CREATE TABLE IF NOT EXISTS ubicaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      dispositivo_id TEXT NOT NULL,
      latitud REAL NOT NULL, 
      longitud REAL NOT NULL, 
      fecha_hora TEXT NOT NULL
    );
  `);
  
  return db;
};

// Función para insertar una coordenada
export const insertLocation = async (latitud: number, longitud: number, dispositivoId: string) => {
  const db = await SQLite.openDatabaseAsync('ubicaciones.db');
  const fechaHora = new Date().toISOString();
  
  await db.runAsync(
    'INSERT INTO ubicaciones (dispositivo_id, latitud, longitud, fecha_hora) VALUES (?, ?, ?, ?)',
    dispositivoId,
    latitud,
    longitud,
    fechaHora
  );
  
  console.log(`Coordenada guardada en BD local: ${latitud}, ${longitud}`);
  return fechaHora;
};

// Función para obtener todas las coordenadas guardadas
export const getLocations = async () => {
  const db = await SQLite.openDatabaseAsync('ubicaciones.db');
  const allRows = await db.getAllAsync('SELECT * FROM ubicaciones ORDER BY id DESC');
  return allRows;
};

// Función para limpiar la base de datos (opcional, para pruebas)
export const clearLocations = async () => {
  const db = await SQLite.openDatabaseAsync('ubicaciones.db');
  await db.execAsync('DELETE FROM ubicaciones');
};
