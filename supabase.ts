import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nvjxmakuobzmjcurwgat.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52anhtYWt1b2J6bWpjdXJ3Z2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxODExNTMsImV4cCI6MjA5Mzc1NzE1M30.lrrnKFFT3Wj7svT1z_AGMZg6rSECI_Ri5IJlhIDhQL0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const pushLocationToSupabase = async (latitud: number, longitud: number, fechaHora: string, dispositivoId: string) => {
  try {
    const { data, error } = await supabase
      .from('ubicaciones')
      .insert([
        { dispositivo_id: dispositivoId, latitud, longitud, fecha_hora: fechaHora },
      ]);

    if (error) {
      console.error('Error enviando a Supabase:', error);
      return false;
    }
    
    console.log('¡Sincronizado con Supabase exitosamente!');
    return true;
  } catch (err) {
    console.error('Excepción al conectar con Supabase:', err);
    return false;
  }
};

export const savePushTokenToSupabase = async (dispositivoId: string, pushToken: string) => {
  try {
    const { error } = await supabase
      .from('dispositivos')
      .upsert(
        { dispositivo_id: dispositivoId, push_token: pushToken },
        { onConflict: 'dispositivo_id' }
      );

    if (error) {
      console.error('Error guardando Push Token:', error);
      return false;
    }
    console.log('Push Token guardado en Supabase.');
    return true;
  } catch (err) {
    console.error('Excepción guardando Push Token:', err);
    return false;
  }
};
