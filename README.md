# Rider Delivery App - React Native

A complete React Native mobile app for delivery riders to manage and track orders.

## 🚀 Features

### 1. **Authentication**
- Rider login with JWT token storage
- Secure API communication
- Auto-logout on token expiration

### 2. **Orders Dashboard**
- View all assigned orders
- Real-time order updates via SignalR
- Pull-to-refresh functionality
- Order status badges (Pending, Accepted, Delivered)

### 3. **Order Actions**
- Accept pending orders
- Mark orders as delivered
- View detailed order information

### 4. **Real-Time Location Tracking**
- GPS location tracking every 5 seconds
- Send location to server automatically
- Live tracking screen with coordinates
- Speed and altitude display

### 5. **SignalR Integration**
- Real-time order updates
- Instant notifications
- Automatic reconnection

## 📱 Screens

1. **Login Screen** - Rider authentication
2. **Orders List** - Dashboard showing all assigned orders
3. **Order Details** - Complete order information and actions
4. **Tracking** - Live GPS location tracking

## 🛠️ Tech Stack

- **React Native** with Expo
- **Axios** for API calls
- **AsyncStorage** for token persistence
- **React Navigation** for routing
- **SignalR** for real-time updates
- **Expo Location** for GPS tracking

## 📦 Installation

### Prerequisites
- Node.js installed
- Expo CLI installed: `npm install -g expo-cli`
- Backend API running at `http://localhost:5157`

### Setup Steps

1. **Install Dependencies**
```bash
cd rider-app
npm install
```

2. **Configure API URL**
Edit `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://YOUR_IP_ADDRESS:5157/api';
```

3. **Start the App**
```bash
expo start
```

4. **Run on Device**
- Scan QR code with Expo Go app (iOS/Android)
- Or press `a` for Android emulator
- Or press `i` for iOS simulator

## 🔧 API Endpoints Required

Your backend should have these endpoints:

```
POST   /api/auth/login                    - Rider login
GET    /api/delivery/rider/{riderId}      - Get assigned orders
POST   /api/delivery/accept/{orderId}     - Accept order
POST   /api/delivery/deliver/{orderId}    - Mark delivered
POST   /api/delivery/location             - Send location
GET    /api/delivery/orders/{orderId}     - Order details
```

## 📡 SignalR Hub

Connection to: `/deliveryhub`

Events:
- `ReceiveOrderUpdate` - Order status changes
- `LocationUpdated` - Location broadcast

## 🎨 UI Features

- Clean, modern interface
- Color-coded order statuses
- Responsive design
- Loading states
- Error handling
- Confirmation dialogs

## ⚙️ Configuration

### Update API Base URL
File: `src/services/api.js`
```javascript
const API_BASE_URL = 'http://YOUR_SERVER_IP:5157/api';
```

### Update SignalR Hub URL
File: `src/services/signalRService.js`
```javascript
.withUrl('http://YOUR_SERVER_IP:5157/deliveryhub')
```

## 🚦 Usage Flow

1. **Login** → Enter rider credentials
2. **View Orders** → See all assigned deliveries
3. **Accept Order** → Tap "Accept Order" button
4. **View Details** → Click order for full info
5. **Track Location** → Navigate to Tracking screen
6. **Deliver** → Mark as delivered when done

## 📍 Location Permissions

The app requires location permissions:
- iOS: Automatically requested
- Android: Add to `app.json`:
```json
"permissions": [
  "ACCESS_FINE_LOCATION",
  "ACCESS_BACKGROUND_LOCATION"
]
```

## 🔐 Security

- JWT tokens stored in AsyncStorage
- Token auto-refresh on 401 errors
- Secure API communication
- Session management

## 🐛 Troubleshooting

### App won't connect to backend
- Check API_BASE_URL is correct
- Ensure backend is running
- Verify network connectivity

### Location not updating
- Grant location permissions
- Check GPS is enabled on device
- Verify backend endpoint exists

### SignalR not connecting
- Check hub URL is correct
- Verify CORS is enabled on backend
- Check network connection

## 📝 Notes

- Change rider ID logic based on your auth system
- Customize colors in stylesheets
- Add more languages as needed
- Extend with push notifications

## 🎯 Next Steps

Optional enhancements:
- Push notifications for new orders
- Offline mode support
- Route optimization
- Customer contact integration
- Photo proof of delivery
- Signature capture

## 📄 License

MIT License - Feel free to use in your projects!
