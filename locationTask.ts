import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { insertLocation } from './database';
import { pushLocationToSupabase } from './supabase';
import { getDeviceId } from './deviceAuth';

export const LOCATION_TASK_NAME = 'background-location-task';

// Definimos la tarea en segundo plano
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Error en la tarea de ubicación en segundo plano:", error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      const { coords } = locations[0];
      const { latitude, longitude } = coords;
      
      console.log(`[Segundo Plano] Ubicación recibida: ${latitude}, ${longitude}`);
      
      // Obtener el ID único de este teléfono
      const dispositivoId = await getDeviceId();

      // Guardar en la base de datos local
      const fechaHora = await insertLocation(latitude, longitude, dispositivoId);
      
      // Intentar enviar a Supabase
      await pushLocationToSupabase(latitude, longitude, fechaHora, dispositivoId);
    }
  }
});
