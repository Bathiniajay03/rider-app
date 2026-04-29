import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deliveryApi } from '../services/api';

const STEP_ORDER = ['pending', 'assigned', 'accepted', 'outfordelivery', 'delivered'];

const OrderDetailsScreen = ({ route, navigation }) => {
  const initialOrder = route?.params?.order;
  const orderId = initialOrder?.id;
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [riderId, setRiderId] = useState(null);

  const currentStatus = (order?.deliveryStatus?.status || order?.status || 'Pending').toLowerCase();
  const assignedRiderId = Number(order?.deliveryStatus?.riderId || order?.assignedRiderId || 0);

  useEffect(() => {
    const loadRiderId = async () => {
      const id = await AsyncStorage.getItem('rider_id');
      setRiderId(id ? parseInt(id, 10) : null);
    };

    loadRiderId();
  }, []);

  useEffect(() => {
    let active = true;

    const loadOrderDetails = async () => {
      try {
        setLoading(true);
        if (!orderId) {
          throw new Error('Order details are unavailable.');
        }

        const freshOrder = await deliveryApi.getOrderDetails(orderId);
        if (active) {
          setOrder(freshOrder);
        }
      } catch (error) {
        if (active) {
          Alert.alert(
            'Could not load order',
            error.response?.data?.message || error.message || 'Please try again.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadOrderDetails();

    return () => {
      active = false;
    };
  }, [orderId]);

  const currentStepIndex = useMemo(() => {
    const index = STEP_ORDER.indexOf(currentStatus);
    return index >= 0 ? index : 0;
  }, [currentStatus]);

  const isAssignedToCurrentRider = !assignedRiderId || !riderId || assignedRiderId === riderId;
  const canAccept = currentStatus === 'pending' && isAssignedToCurrentRider;
  const canDeliver = isAssignedToCurrentRider && ['assigned', 'accepted', 'outfordelivery'].includes(currentStatus);

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await deliveryApi.acceptOrder(order.id);
      const updated = await deliveryApi.getOrderDetails(order.id);
      setOrder(updated);
      Alert.alert('Accepted', 'Order moved to your route.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (!isAssignedToCurrentRider) {
      Alert.alert('Not assigned', 'This order is assigned to another rider.');
      return;
    }

    setActionLoading(true);
    try {
      await deliveryApi.deliverOrder(order.id);
      Alert.alert('Delivered', 'Order marked delivered successfully.');
      navigation.replace('Orders');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to deliver order');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !order) {
    return (
      <SafeAreaView style={styles.loadingRoot}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
              <Text style={styles.heroSubtitle}>{order.customerName}</Text>
            </View>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>{currentStatus}</Text>
            </View>
          </View>

          <View style={styles.routeSummary}>
            <View style={styles.routeStat}>
              <Text style={styles.routeStatLabel}>Items</Text>
              <Text style={styles.routeStatValue}>{order.items?.length || 0}</Text>
            </View>
            <View style={styles.routeStat}>
              <Text style={styles.routeStatLabel}>Value</Text>
              <Text style={styles.routeStatValue}>₹{Number(order.totalAmount || 0).toFixed(0)}</Text>
            </View>
            <View style={styles.routeStat}>
              <Text style={styles.routeStatLabel}>ETA</Text>
              <Text style={styles.routeStatValue}>Live</Text>
            </View>
          </View>
        </View>

        <View style={styles.stepCard}>
          <Text style={styles.sectionTitle}>Delivery progress</Text>
          <View style={styles.stepRow}>
            {STEP_ORDER.map((step, index) => {
              const isDone = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <View key={step} style={styles.stepWrap}>
                  <View style={[
                    styles.stepDot,
                    isDone && styles.stepDotDone,
                    isCurrent && styles.stepDotCurrent
                  ]}>
                    <Text style={styles.stepDotText}>{index + 1}</Text>
                  </View>
                  <Text style={[
                    styles.stepLabel,
                    (isDone || isCurrent) && styles.stepLabelActive
                  ]}>
                    {step === 'outfordelivery' ? 'out' : step}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Delivery address</Text>
          <Text style={styles.valueBlock}>{order.deliveryAddress || 'No address available'}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order items</Text>
          {order.items?.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.productName || 'Product'}</Text>
                <Text style={styles.itemMeta}>Qty {item.quantity} • ₹{Number(item.price || 0).toFixed(2)} each</Text>
              </View>
              <Text style={styles.itemTotal}>₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Trip summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Created</Text>
            <Text style={styles.summaryValue}>{new Date(order.createdAt).toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery status</Text>
            <Text style={styles.summaryValue}>{order.deliveryStatus?.status || order.status || 'Pending'}</Text>
          </View>
          {order.deliveryStatus?.riderId && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rider ID</Text>
              <Text style={styles.summaryValue}>{order.deliveryStatus.riderId}</Text>
            </View>
          )}
          {assignedRiderId && riderId && assignedRiderId !== riderId ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Access</Text>
              <Text style={styles.summaryValue}>Assigned to another rider</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actionCard}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Tracking', { order })}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>Start tracking</Text>
          </TouchableOpacity>

          {canAccept && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAccept}
              disabled={actionLoading}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>
                {actionLoading ? 'Working...' : 'Accept order'}
              </Text>
            </TouchableOpacity>
          )}

          {canDeliver && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleDeliver}
              disabled={actionLoading}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>
                {actionLoading ? 'Working...' : 'Mark delivered'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {order.deliveryInstructions ? (
          <View style={styles.instructionsCard}>
            <Text style={styles.sectionTitle}>Delivery instructions</Text>
            <Text style={styles.instructionsText}>{order.deliveryInstructions}</Text>
          </View>
        ) : null}
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
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    marginTop: 12,
    color: '#fff',
    fontWeight: '700',
  },
  heroCard: {
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
    gap: 12,
  },
  orderNumber: {
    color: '#10233d',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  heroSubtitle: {
    color: '#64748b',
    marginTop: 6,
    fontWeight: '600',
  },
  statusChip: {
    backgroundColor: '#e8f1ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusChipText: {
    color: '#2563eb',
    fontWeight: '900',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  routeSummary: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  routeStat: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  routeStatLabel: {
    color: '#64748b',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  routeStatValue: {
    color: '#10233d',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    color: '#10233d',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepWrap: {
    flex: 1,
    alignItems: 'center',
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#d9e3ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: '#2563eb',
  },
  stepDotCurrent: {
    backgroundColor: '#2563eb',
  },
  stepDotText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  stepLabel: {
    color: '#8aa0b3',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 7,
    textTransform: 'uppercase',
  },
  stepLabelActive: {
    color: '#10233d',
  },
  sectionCard: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  valueBlock: {
    color: '#334a62',
    lineHeight: 22,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  itemName: {
    color: '#10233d',
    fontWeight: '800',
    fontSize: 15,
  },
  itemMeta: {
    color: '#64748b',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  itemTotal: {
    color: '#2563eb',
    fontWeight: '900',
    fontSize: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  summaryLabel: {
    color: '#64748b',
    fontWeight: '700',
  },
  summaryValue: {
    color: '#10233d',
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },
  actionCard: {
    marginTop: 14,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  secondaryButtonText: {
    color: '#1d3852',
    fontWeight: '900',
    fontSize: 15,
  },
  instructionsCard: {
    marginTop: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  instructionsText: {
    color: '#475569',
    lineHeight: 22,
    fontWeight: '600',
  },
});

export default OrderDetailsScreen;
