import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configuramos cómo se comportan las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('¡Permiso denegado para enviar Notificaciones Push!');
      return;
    }
    
    // Obtener el ID del proyecto de EAS (requerido en SDK 50+)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('No se encontró el projectId de EAS. Asegúrate de compilar usando EAS Build.');
    }

    try {
      const pushTokenString = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      token = pushTokenString;
      console.log('Push Token obtenido:', token);
    } catch (e) {
      console.error('Error obteniendo Push Token:', e);
    }
  } else {
    console.log('Las notificaciones Push no funcionan en Simuladores. Usa un dispositivo físico.');
  }

  return token;
}
