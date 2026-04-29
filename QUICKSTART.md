# 🚀 Quick Start Guide - Rider Delivery App

## Step-by-Step Setup (5 minutes)

### 1️⃣ Install Dependencies

```bash
cd rider-app
npm install
```

**Wait for installation to complete** (~2-3 minutes)

---

### 2️⃣ Configure Backend URL

Open `src/services/api.js` and change:

```javascript
// Line 4 - Change this:
const API_BASE_URL = 'http://localhost:5157/api';

// To your computer's IP address (for testing on phone):
const API_BASE_URL = 'http://YOUR_IP_ADDRESS:5157/api';
```

**Find your IP address:**
- Windows: Open CMD → type `ipconfig` → look for IPv4 Address
- Usually: `192.168.x.x` or `10.0.x.x`

Also update SignalR in `src/services/signalRService.js`:

```javascript
// Line 11 - Change to your IP:
.withUrl('http://YOUR_IP_ADDRESS:5157/deliveryhub')
```

---

### 3️⃣ Start Expo Development Server

```bash
npm start
# or
expo start
```

You'll see a QR code in the terminal.

---

### 4️⃣ Run on Your Phone

#### Option A: Physical Device (Recommended)

1. **Install Expo Go app:**
   - iPhone: App Store → "Expo Go"
   - Android: Play Store → "Expo Go"

2. **Scan QR Code:**
   - iPhone: Use Camera app
   - Android: Use Expo Go app

3. **App loads automatically!**

#### Option B: Emulator/Simulator

Press in terminal:
- `a` - Android emulator
- `i` - iOS simulator (Mac only)

---

### 5️⃣ Test the App

#### Login Screen
- Enter any email/password (backend validation depends on your API)
- Try: `rider@test.com` / `password123`

#### Orders Screen
- Shows all assigned orders
- Pull down to refresh
- Tap order for details

#### Order Actions
- **Accept Order** - Changes status from Pending → Accepted
- **Mark Delivered** - Changes status from Accepted → Delivered

#### Tracking Screen
- Tap "Live Tracking" in navigation
- Grants location permission
- See your GPS coordinates
- Updates every 5 seconds

---

## 🔧 Common Issues & Fixes

### ❌ "Network request failed"

**Problem:** Can't connect to backend

**Solution:**
1. Make sure backend is running: `http://localhost:5157`
2. Update API_BASE_URL with your correct IP address
3. Check firewall allows connections on port 5157
4. On same WiFi network as computer

---

### ❌ "Location permission denied"

**Problem:** Can't get GPS location

**Solution:**
1. Grant location permission when prompted
2. Go to phone Settings → Apps → Expo Go → Permissions → Location → Allow
3. Enable GPS/Location Services on phone

---

### ❌ "SignalR connection failed"

**Problem:** Real-time updates not working

**Solution:**
1. Check SignalR hub URL is correct
2. Verify backend has `/deliveryhub` endpoint
3. Check CORS is enabled in backend

---

### ❌ QR code won't scan

**Problem:** Camera doesn't recognize QR

**Solution:**
1. Increase screen brightness
2. Hold phone steady 6-8 inches from screen
3. Try using Expo Go app directly instead of camera

---

## 🎨 Customization

### Change Colors

Edit screen stylesheets:

```javascript
// Primary green color
backgroundColor: '#4CAF50' // Change to your brand color

// Status colors
statusPending: { backgroundColor: '#FFA500' }
statusAccepted: { backgroundColor: '#2196F3' }
statusDelivered: { backgroundColor: '#4CAF50' }
```

### Change App Name

Edit `app.json`:

```json
{
  "name": "Your App Name",
  "displayName": "Your Display Name"
}
```

### Add Navigation Button

In `OrdersScreen.js`, add button to go to Tracking:

```javascript
<TouchableOpacity 
  onPress={() => navigation.navigate('Tracking')}
  style={styles.trackButton}
>
  <Text>📍 Track Location</Text>
</TouchableOpacity>
```

---

## 📱 Production Build

### Build APK (Android)

```bash
eas build --platform android
```

### Build IPA (iOS)

```bash
eas build --platform ios
```

Requires Expo account and EAS setup.

---

## ✅ Checklist

Before going live:

- [ ] Backend API is production-ready
- [ ] API URLs point to production server
- [ ] Rider authentication works correctly
- [ ] All endpoints tested
- [ ] Location permissions configured
- [ ] SignalR hub deployed
- [ ] Error handling sufficient
- [ ] UI customized to brand

---

## 🎯 Next Steps

1. **Test thoroughly** with real orders
2. **Customize branding** (colors, logo, name)
3. **Add rider registration** if needed
4. **Implement push notifications** (optional)
5. **Deploy backend** to production
6. **Build production APK/IPA**
7. **Distribute to riders**

---

## 📞 Support

If you need help:

1. Check README.md for detailed docs
2. Review error logs in Expo console
3. Test backend endpoints with Postman
4. Verify all dependencies installed

---

**Happy Delivering! 🚴‍♂️💨**
