import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deliveryApi } from '../services/api';
import signalRService from '../services/signalRService';

const TrackingScreen = ({ navigation, route }) => {
  const order = route?.params?.order;
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [riderId, setRiderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadRiderId();
    signalRService.initializeConnection().catch(() => {});

    return () => {
      stopLocationTracking();
      signalRService.stop().catch(() => {});
    };
  }, []);

  const loadRiderId = async () => {
    try {
      const id = await AsyncStorage.getItem('rider_id');
      if (id) {
        setRiderId(parseInt(id, 10));
      }
    } catch (error) {
      console.error('Error loading rider ID:', error);
    }
  };

  const sendLocationToServer = async (coords) => {
    const resolvedRiderId = riderId || Number(await AsyncStorage.getItem('rider_id') || '0');
    if (!resolvedRiderId) return;

    try {
      await deliveryApi.sendLocation(resolvedRiderId, coords.latitude, coords.longitude);
      setLastSentAt(new Date());
    } catch (error) {
      console.error('Error sending location:', error);
    }
  };

  const startRealTimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentLocation.coords);
        await sendLocationToServer(currentLocation.coords);
      } catch (error) {
        console.error('Error updating location:', error);
      }
    }, 5000);
  };

  const startLocationTracking = async () => {
    setLoading(true);
    try {
      if (!riderId) {
        await loadRiderId();
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is needed for tracking.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentLocation.coords);
      setTracking(true);
      await sendLocationToServer(currentLocation.coords);
      startRealTimeTracking();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to start tracking');
    } finally {
      setLoading(false);
    }
  };

  const stopLocationTracking = () => {
    setTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const formatCoord = (value) => (typeof value === 'number' ? value.toFixed(6) : 'N/A');

  const getSpeedInfo = () => {
    if (!location?.speed) return 'Stationary';
    return `${(location.speed * 3.6).toFixed(1)} km/h`;
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroLabel}>Live route</Text>
              <Text style={styles.heroTitle}>Tracking cockpit</Text>
            </View>
            <View style={[styles.liveChip, tracking ? styles.liveChipOn : styles.liveChipOff]}>
              <Text style={styles.liveChipText}>{tracking ? 'Tracking' : 'Idle'}</Text>
            </View>
          </View>

          <Text style={styles.heroText}>
            {order ? `En route for ${order.customerName || 'customer'}` : 'Start tracking when you are out for a drop.'}
          </Text>
        </View>

        {order && (
          <View style={styles.orderCard}>
            <Text style={styles.sectionTitle}>Current delivery</Text>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <Text style={styles.orderDetail}>{order.deliveryAddress || 'Address not available'}</Text>
          </View>
        )}

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Latitude</Text>
            <Text style={styles.metricValue}>{formatCoord(location?.latitude)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Longitude</Text>
            <Text style={styles.metricValue}>{formatCoord(location?.longitude)}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Speed</Text>
            <Text style={styles.metricValue}>{getSpeedInfo()}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Altitude</Text>
            <Text style={styles.metricValue}>
              {typeof location?.altitude === 'number' ? `${location.altitude.toFixed(1)} m` : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.mapCard}>
          <Text style={styles.mapTitle}>Route pulse</Text>
          <Text style={styles.mapValue}>
            {tracking ? 'Updating every 5 seconds' : 'Tap start to begin live tracking'}
          </Text>
          <View style={styles.mapFrame}>
            <Text style={styles.mapFrameTitle}>GPS feed</Text>
            <Text style={styles.mapFrameSub}>
              {location ? `${formatCoord(location.latitude)}, ${formatCoord(location.longitude)}` : 'Waiting for location'}
            </Text>
          </View>
        </View>

        <View style={styles.controls}>
          {!tracking ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={startLocationTracking}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Start live tracking</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopLocationTracking}
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>Stop tracking</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Delivery lifecycle</Text>
          <Text style={styles.infoText}>
            • Accept the order from queue{'\n'}
            • Start route tracking before moving{'\n'}
            • Keep GPS active until delivery is complete{'\n'}
            • Mark the order delivered from the details screen
          </Text>
          {lastSentAt && (
            <Text style={styles.lastSent}>
              Last sync: {lastSentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.9}
        >
          <Text style={styles.backButtonText}>Back to order</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  hero: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    color: '#2563eb',
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 11,
  },
  heroTitle: {
    color: '#10233d',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.7,
    marginTop: 4,
  },
  liveChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  liveChipOn: {
    backgroundColor: '#e8f1ff',
  },
  liveChipOff: {
    backgroundColor: '#f8fafc',
  },
  liveChipText: {
    color: '#2563eb',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 11,
  },
  heroText: {
    color: '#64748b',
    marginTop: 10,
    lineHeight: 21,
  },
  orderCard: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    color: '#10233d',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  orderNumber: {
    color: '#2563eb',
    fontWeight: '900',
    fontSize: 20,
  },
  orderDetail: {
    color: '#64748b',
    marginTop: 8,
    lineHeight: 21,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: '#10233d',
    fontWeight: '900',
    fontSize: 16,
    marginTop: 8,
  },
  mapCard: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mapTitle: {
    color: '#10233d',
    fontSize: 16,
    fontWeight: '900',
  },
  mapValue: {
    color: '#64748b',
    marginTop: 6,
    marginBottom: 14,
    lineHeight: 20,
  },
  mapFrame: {
    minHeight: 180,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#dbe4ee',
    borderStyle: 'dashed',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  mapFrameTitle: {
    color: '#2563eb',
    fontSize: 20,
    fontWeight: '900',
  },
  mapFrameSub: {
    color: '#475569',
    marginTop: 8,
    textAlign: 'center',
  },
  controls: {
    marginTop: 14,
  },
  startButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  infoCard: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoText: {
    color: '#475569',
    lineHeight: 22,
    fontWeight: '600',
  },
  lastSent: {
    marginTop: 12,
    color: '#0b5f52',
    fontWeight: '800',
  },
  backButton: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  backButtonText: {
    color: '#1d3852',
    fontWeight: '900',
  },
});

export default TrackingScreen;
