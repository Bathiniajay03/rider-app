import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deliveryApi } from '../services/api';
import signalRService from '../services/signalRService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STATUS_CONFIG = {
  pending: {
    label: 'Ready to Take',
    color: '#FF6B35',
    bg: 'rgba(255, 107, 53, 0.1)',
    icon: '📦',
    gradient: ['#FF6B35', '#F7931E']
  },
  accepted: {
    label: 'On Route',
    color: '#4ECDC4',
    bg: 'rgba(78, 205, 196, 0.1)',
    icon: '🚴',
    gradient: ['#4ECDC4', '#44A08D']
  },
  assigned: {
    label: 'Assigned',
    color: '#45B7D1',
    bg: 'rgba(69, 183, 209, 0.1)',
    icon: '🎯',
    gradient: ['#45B7D1', '#96CEB4']
  },
  outfordelivery: {
    label: 'Delivering',
    color: '#96CEB4',
    bg: 'rgba(150, 206, 180, 0.1)',
    icon: '🏃',
    gradient: ['#96CEB4', '#FECA57']
  },
  delivered: {
    label: 'Completed',
    color: '#6BCF7F',
    bg: 'rgba(107, 207, 127, 0.1)',
    icon: '✅',
    gradient: ['#6BCF7F', '#4ECDC4']
  },
};

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riderId, setRiderId] = useState(null);
  const [riderName, setRiderName] = useState('');
  const [lastSync, setLastSync] = useState(null);
  const [filter, setFilter] = useState('active');
  const [earnings, setEarnings] = useState(0);
  const [onlineStatus, setOnlineStatus] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const loadRiderProfile = useCallback(async () => {
    const [id, name, earningsData] = await Promise.all([
      AsyncStorage.getItem('rider_id'),
      AsyncStorage.getItem('rider_name'),
      AsyncStorage.getItem('today_earnings'),
    ]);

    const parsedId = id ? parseInt(id, 10) : null;
    setRiderId(parsedId);
    setRiderName(name || 'Rider');
    setEarnings(parseFloat(earningsData || '0'));
    return parsedId;
  }, []);

  const fetchOrders = useCallback(async (id) => {
    const resolvedId = id || riderId || Number(await AsyncStorage.getItem('rider_id') || '0');
    if (!resolvedId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const data = await deliveryApi.getAssignedOrders(resolvedId);
      const visibleOrders = Array.isArray(data)
        ? data.filter((order) => {
            const deliveryRiderId = Number(order.deliveryStatus?.riderId || order.assignedRiderId || 0);
            const normalizedStatus = (order.deliveryStatus?.status || order.status || 'Pending').toLowerCase();
            if (normalizedStatus === 'pending' && !deliveryRiderId) return true;
            if (!deliveryRiderId) return true;
            return deliveryRiderId === resolvedId;
          })
        : [];
      setOrders(visibleOrders);
      setLastSync(new Date());
    } catch (error) {
      Alert.alert('Connection Issue', 'Unable to load orders. Check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [riderId]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const id = await loadRiderProfile();
      if (mounted) {
        await fetchOrders(id);
      }
      try {
        await signalRService.initializeConnection();
        signalRService.on('orderUpdate', () => fetchOrders(id));
      } catch (error) {
        console.log('SignalR initialization failed:', error.message);
      }
    };

    init();

    return () => {
      mounted = false;
      signalRService.stop();
    };
  }, [fetchOrders, loadRiderProfile]);

  // Animate in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await deliveryApi.acceptOrder(orderId);
      Alert.alert('🎉 Order Accepted!', 'New delivery added to your route.');
      await fetchOrders();
    } catch (error) {
      Alert.alert('❌ Accept Failed', error.response?.data?.message || 'Unable to accept order');
    }
  };

  const handleDeliverOrder = async (orderId) => {
    try {
      await deliveryApi.deliverOrder(orderId);
      Alert.alert('✅ Delivery Complete!', 'Great job! Keep it up.');
      await fetchOrders();
    } catch (error) {
      Alert.alert('❌ Delivery Failed', error.response?.data?.message || 'Unable to mark as delivered');
    }
  };

  const derivedOrders = useMemo(() => {
    return orders.map((order) => {
      const status = (order.deliveryStatus?.status || order.status || 'Pending').toLowerCase();
      return { ...order, normalizedStatus: status };
    });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return derivedOrders;
    if (filter === 'active') {
      return derivedOrders.filter((order) => ['pending', 'assigned', 'accepted', 'outfordelivery'].includes(order.normalizedStatus));
    }
    return derivedOrders.filter((order) => order.normalizedStatus === filter);
  }, [derivedOrders, filter]);

  const summary = useMemo(() => {
    const total = derivedOrders.length;
    const pending = derivedOrders.filter((order) => order.normalizedStatus === 'pending').length;
    const active = derivedOrders.filter((order) => ['assigned', 'accepted', 'outfordelivery'].includes(order.normalizedStatus)).length;
    const delivered = derivedOrders.filter((order) => order.normalizedStatus === 'delivered').length;
    return { total, pending, active, delivered };
  }, [derivedOrders]);

  const activeOrder = useMemo(() => {
    return derivedOrders.find((order) => ['pending', 'assigned', 'accepted', 'outfordelivery'].includes(order.normalizedStatus));
  }, [derivedOrders]);

  const renderOrder = ({ item, index }) => {
    const statusMeta = STATUS_CONFIG[item.normalizedStatus] || {
      label: item.normalizedStatus || 'Unknown',
      color: '#64748b',
      bg: '#eef2f7',
      icon: '❓',
      gradient: ['#64748b', '#475569']
    };
    const itemsCount = item.items?.length || 0;
    const assignedRiderId = Number(item.deliveryStatus?.riderId || item.assignedRiderId || 0);
    const canAccept = item.normalizedStatus === 'pending';
    const canDeliver = ['assigned', 'accepted', 'outfordelivery'].includes(item.normalizedStatus) && (!assignedRiderId || assignedRiderId === riderId);

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          style={[styles.orderCard, { marginTop: index === 0 ? 0 : 12 }]}
          onPress={() => navigation.navigate('OrderDetails', { order: item })}
          activeOpacity={0.9}
        >
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
            <Text style={styles.statusIcon}>{statusMeta.icon}</Text>
            <Text style={[styles.statusBadgeText, { color: statusMeta.color }]}>
              {statusMeta.label}
            </Text>
          </View>

          {/* Order Header */}
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
              <Text style={styles.customerName}>{item.customerName}</Text>
            </View>
            <View style={styles.orderValue}>
              <Text style={styles.valueText}>₹{item.totalAmount?.toFixed(0) || '0'}</Text>
              <Text style={styles.itemsText}>{itemsCount} item{itemsCount !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* Address */}
          <View style={styles.addressContainer}>
            <Text style={styles.addressIcon}>📍</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {item.deliveryAddress || 'Address not available'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => navigation.navigate('OrderDetails', { order: item })}
            >
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>

            {canAccept && (
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAcceptOrder(item.id)}
              >
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
            )}

            {canDeliver && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deliverButton]}
                onPress={() => handleDeliverOrder(item.id)}
              >
                <Text style={styles.actionButtonText}>Deliver</Text>
              </TouchableOpacity>
            )}

            {!canAccept && !canDeliver && (
              <TouchableOpacity
                style={[styles.actionButton, styles.trackButton]}
                onPress={() => navigation.navigate('Tracking', { order: item })}
              >
                <Text style={styles.actionButtonText}>Track</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="light" />

      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {riderName?.charAt(0)?.toUpperCase() || 'R'}
            </Text>
          </View>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.riderName}>{riderName}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.statusButton, onlineStatus ? styles.onlineButton : styles.offlineButton]}
            onPress={() => setOnlineStatus(!onlineStatus)}
          >
            <View style={[styles.statusDot, onlineStatus ? styles.onlineDot : styles.offlineDot]} />
            <Text style={[styles.statusText, onlineStatus ? styles.onlineText : styles.offlineText]}>
              {onlineStatus ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              await deliveryApi.logout();
              navigation.replace('Login');
            }}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Earnings Card */}
      <View style={styles.earningsCard}>
        <View style={styles.earningsHeader}>
          <Text style={styles.earningsLabel}>Today's Earnings</Text>
          <Text style={styles.earningsAmount}>₹{earnings.toFixed(0)}</Text>
        </View>
        <View style={styles.earningsStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{summary.delivered}</Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{summary.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{summary.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'active', label: 'Active', count: summary.active },
          { key: 'pending', label: 'Available', count: summary.pending },
          { key: 'delivered', label: 'Completed', count: summary.delivered },
          { key: 'all', label: 'All', count: summary.total },
        ].map((item) => {
          const isActive = filter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {item.label}
              </Text>
              <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                  {item.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Loading your deliveries...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>
            {filter === 'active' ? '🚴' : filter === 'pending' ? '📦' : '✅'}
          </Text>
          <Text style={styles.emptyTitle}>
            {filter === 'active' ? 'No active deliveries' :
             filter === 'pending' ? 'No orders available' :
             'No completed deliveries'}
          </Text>
          <Text style={styles.emptyText}>
            {filter === 'active' ? 'Accept some orders to get started!' :
             filter === 'pending' ? 'New orders will appear here soon.' :
             'Your completed deliveries will show here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4ECDC4"
              colors={['#4ECDC4']}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.syncText}>
                Last updated: {lastSync ? lastSync.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Never'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1A1F26',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2F36',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  greeting: {
    fontSize: 12,
    color: '#8B949E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  onlineButton: {
    backgroundColor: 'rgba(107, 207, 127, 0.1)',
  },
  offlineButton: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineDot: {
    backgroundColor: '#6BCF7F',
  },
  offlineDot: {
    backgroundColor: '#FF6B35',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  onlineText: {
    color: '#6BCF7F',
  },
  offlineText: {
    color: '#FF6B35',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '500',
  },

  // Earnings Card
  earningsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#1A1F26',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2F36',
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  earningsStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#2A2F36',
  },

  // Filter Styles
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#1A1F26',
    borderWidth: 1,
    borderColor: '#2A2F36',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B949E',
  },
  filterTabTextActive: {
    color: '#0F1419',
  },
  filterBadge: {
    backgroundColor: '#2A2F36',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(15, 20, 25, 0.8)',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8B949E',
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Order Card Styles
  orderCard: {
    marginHorizontal: 20,
    backgroundColor: '#1A1F26',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2F36',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  orderValue: {
    alignItems: 'flex-end',
  },
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  itemsText: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 2,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  addressIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#B0B7BF',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#2A2F36',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#6BCF7F',
  },
  deliverButton: {
    backgroundColor: '#4ECDC4',
  },
  trackButton: {
    backgroundColor: '#45B7D1',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderWidth: 3,
    borderColor: '#4ECDC4',
    borderTopColor: 'transparent',
    borderRadius: 20,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 20,
  },

  // List Styles
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  syncText: {
    fontSize: 12,
    color: '#8B949E',
  },
  riderId: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  logoutButton: {
    borderRadius: 999,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  logoutButtonText: {
    color: '#334155',
    fontWeight: '800',
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: -20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#2563eb',
    marginRight: 8,
  },
  heroStatusText: {
    color: '#2563eb',
    fontWeight: '800',
    fontSize: 13,
  },
  heroTitle: {
    color: '#10233d',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summaryCard: {
    flexGrow: 1,
    minWidth: '22%',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  summaryValue: {
    color: '#10233d',
    fontSize: 22,
    fontWeight: '900',
  },
  summaryLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    color: '#334a62',
    fontWeight: '800',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  featuredCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  featuredLabel: {
    color: '#2563eb',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  featuredTitle: {
    color: '#10233d',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  featuredText: {
    color: '#48655b',
    marginTop: 6,
    lineHeight: 20,
  },
  stateCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stateTitle: {
    color: '#10233d',
    fontSize: 18,
    fontWeight: '900',
  },
  stateText: {
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  orderNumber: {
    color: '#10233d',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  customerName: {
    color: '#64748b',
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusPillText: {
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  metaChip: {
    flex: 1,
    backgroundColor: '#f7fbff',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaValue: {
    color: '#10233d',
    fontSize: 16,
    fontWeight: '900',
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  addressBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addressLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  addressText: {
    color: '#10233d',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '900',
  },
  secondaryButton: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe4ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#1d3852',
    fontWeight: '900',
  },
  syncCard: {
    marginTop: 4,
    marginBottom: 12,
    alignItems: 'center',
  },
  syncLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  syncValue: {
    color: '#10233d',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4,
  },
});

export default OrdersScreen;
