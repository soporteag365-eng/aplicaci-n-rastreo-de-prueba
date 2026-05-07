import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@tracker_device_id';

// Genera un ID aleatorio simple (ej: usr_a8b9c0d1)
const generateRandomId = () => {
  return 'usr_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
};

export const getDeviceId = async (): Promise<string> => {
  try {
    const existingId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (existingId !== null) {
      // Si ya existe, lo retornamos
      return existingId;
    }
    
    // Si no existe, generamos uno nuevo, lo guardamos y lo retornamos
    const newId = generateRandomId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    console.log('Nuevo Dispositivo Registrado:', newId);
    return newId;
    
  } catch (error) {
    console.error('Error accediendo al Device ID:', error);
    return 'usr_unknown_error';
  }
};
