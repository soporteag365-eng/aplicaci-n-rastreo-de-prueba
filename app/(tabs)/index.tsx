import { Image } from 'expo-image';
import { Pressable, StyleSheet, FlatList, View } from 'react-native';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getLocations, clearLocations } from '../../database';
import { LOCATION_TASK_NAME } from '../../locationTask';
import { registerForPushNotificationsAsync } from '../../notifications';
import { savePushTokenToSupabase } from '../../supabase';
import { getDeviceId } from '../../deviceAuth';

export default function HomeScreen() {
  const [isTracking, setIsTracking] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar las ubicaciones de la BD al iniciar y cada 5 segundos
  useEffect(() => {
    loadLocations();
    const interval = setInterval(loadLocations, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error cargando ubicaciones:', error);
    }
  };

  const startTracking = async () => {
    setErrorMsg(null);
    try {
      // 1. Pedir permiso para usar la ubicación mientras la app está abierta
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado.');
        return;
      }

      // 2. Pedir permiso para usar la ubicación en segundo plano
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        setErrorMsg('Permiso de segundo plano denegado. No podré rastrear si cierras la app.');
        return;
      }

      // 3. Iniciar el rastreo en segundo plano
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000, // Cada 10 segundos para pruebas (en produccion usa más tiempo)
        distanceInterval: 10, // o cada 10 metros
        showsBackgroundLocationIndicator: true, // Requerido en iOS
      });

      // 4. Obtener Push Token y registrar el dispositivo en la Nube
      const token = await registerForPushNotificationsAsync();
      if (token) {
        const dispositivoId = await getDeviceId();
        await savePushTokenToSupabase(dispositivoId, token);
      }

      setIsTracking(true);
    } catch (err) {
      setErrorMsg('Error al iniciar el rastreo: ' + String(err));
    }
  };

  const stopTracking = async () => {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
      setIsTracking(false);
    } catch (err) {
      setErrorMsg('Error al detener: ' + String(err));
    }
  };

  const handleClear = async () => {
    await clearLocations();
    await loadLocations();
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#6C63FF', dark: '#3B3486' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Rastreador GPS 📍</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText>
          Presiona el botón para iniciar la captura de coordenadas. Los datos se guardarán automáticamente en tu base de datos local (SQLite).
        </ThemedText>
        
        {errorMsg && <ThemedText style={{color: 'red'}}>{errorMsg}</ThemedText>}

        <ThemedView style={styles.buttonRow}>
          {!isTracking ? (
            <Pressable style={[styles.button, styles.buttonStart]} onPress={startTracking}>
              <ThemedText style={styles.buttonText}>▶ Iniciar Rastreo</ThemedText>
            </Pressable>
          ) : (
            <Pressable style={[styles.button, styles.buttonStop]} onPress={stopTracking}>
              <ThemedText style={styles.buttonText}>■ Detener Rastreo</ThemedText>
            </Pressable>
          )}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedView style={styles.headerRow}>
          <ThemedText type="subtitle">🗄️ Base de Datos Local</ThemedText>
          <Pressable onPress={handleClear}>
            <ThemedText style={{ color: '#ca229aff' }}>Limpiar DB</ThemedText>
          </Pressable>
        </ThemedView>
        <ThemedText>
          Total registros: {locations.length} (se actualiza cada 5s)
        </ThemedText>

        <View style={styles.listContainer}>
          {locations.slice(0, 5).map((loc) => (
            <View key={loc.id} style={styles.listItem}>
              <ThemedText style={styles.listId}>ID: {loc.id}</ThemedText>
              <ThemedText>Lat: {loc.latitud.toFixed(4)}</ThemedText>
              <ThemedText>Lon: {loc.longitud.toFixed(4)}</ThemedText>
            </View>
          ))}
          {locations.length > 5 && (
            <ThemedText style={{ textAlign: 'center', marginTop: 10 }}>
              Y {locations.length - 5} registros más...
            </ThemedText>
          )}
        </View>
      </ThemedView>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  buttonRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonStart: {
    backgroundColor: '#ca229aff',
  },
  buttonStop: {
    backgroundColor: '#a92020ff',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listContainer: {
    marginTop: 10,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: 8,
    padding: 10,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  listId: {
    fontWeight: 'bold',
    width: 50,
  }
});
