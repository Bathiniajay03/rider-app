# 🎨 App Screenshots & Mockups

## Screen Layouts

### 1. Login Screen
```
┌─────────────────────────┐
│                         │
│    Rider Delivery       │
│   Sign in to continue   │
│                         │
│  ┌──────────────────┐  │
│  │ Email            │  │
│  └──────────────────┘  │
│                         │
│  ┌──────────────────┐  │
│  │ Password         │  │
│  └──────────────────┘  │
│                         │
│  ┌──────────────────┐  │
│  │     LOGIN        │  │
│  └──────────────────┘  │
│                         │
└─────────────────────────┘
```

---

### 2. Orders Dashboard
```
┌─────────────────────────┐
│ My Orders        Logout │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │ Order #CO-12345     │ │
│ │ John Doe      [Pend]│ │
│ │ 📍 123 Main St      │ │
│ │ 📦 3 items - $299   │ │
│ │ [Accept Order]      │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Order #CO-12346     │ │
│ │ Jane Smith    [Acc] │ │
│ │ 📍 456 Oak Ave      │ │
│ │ 📦 1 item - $99     │ │
│ │ [Mark Delivered]    │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Order #CO-12347     │ │
│ │ Bob Johnson   [Del] │ │
│ │ 📍 789 Pine Rd      │ │
│ │ 📦 2 items - $150   │ │
│ └─────────────────────┘ │
│                         │
└─────────────────────────┘
```

---

### 3. Order Details
```
┌─────────────────────────┐
│ Order #CO-12345         │
│ Accepted                │
├─────────────────────────┤
│ Customer Information    │
│ Name: John Doe          │
│ Address: 123 Main St    │
│                         │
│ Order Items             │
│ ┌─────────────────────┐ │
│ │ Product A    x2     │ │
│ │              $100   │ │
│ ├─────────────────────┤ │
│ │ Product B    x1     │ │
│ │               $50   │ │
│ └─────────────────────┘ │
│                         │
│ Total Amount: $250.00   │
│ Created: 2026-03-30     │
│                         │
│ ┌─────────────────────┐ │
│ │  Mark as Delivered  │ │
│ └─────────────────────┘ │
│                         │
│ Delivery Instructions   │
│ Leave at front door     │
└─────────────────────────┘
```

---

### 4. Live Tracking
```
┌─────────────────────────┐
│ Live Tracking     Back  │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │ Tracking Status     │ │
│ │      🟢 Active      │ │
│ └─────────────────────┘ │
│                         │
│ Current Location        │
│ Latitude: 40.7128       │
│ Longitude: -74.0060     │
│ Speed: 25.5 km/h        │
│ Altitude: 10.2 m        │
│                         │
│ ┌─────────────────────┐ │
│ │                     │ │
│ │   📍 Live Location  │ │
│ │  Updates every 5s   │ │
│ │                     │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │   Stop Tracking     │ │
│ └─────────────────────┘ │
│                         │
│ ℹ️ How it works         │
│ • Location sent every 5s│
│ • Customers can track   │
│ • Keep GPS enabled      │
└─────────────────────────┘
```

---

## Color Palette

### Primary Colors
```
Green (Primary):  #4CAF50  ████
Blue (Secondary): #2196F3  ████
Orange (Warning): #FFA500  ████
Red (Danger):     #FF4444  ████
```

### Status Colors
```
Pending:    #FFA500  ████  (Orange)
Accepted:   #2196F3  ████  (Blue)
Delivered:  #4CAF50  ████  (Green)
Default:    #999999  ████  (Gray)
```

### Neutral Colors
```
Background:   #F5F5F5  ████  (Light Gray)
Card White:   #FFFFFF  ████  (Pure White)
Text Dark:    #333333  ████  (Dark Gray)
Text Medium:  #666666  ████  (Medium Gray)
Text Light:   #999999  ████  (Light Gray)
Border:       #DDDDDD  ████  (Border Gray)
```

---

## Typography Scale

```
Title Large:    32px Bold      (Login title)
Title:          24px Bold      (Screen headers)
Heading:        18px Bold      (Card titles)
Body Large:     16px Regular   (Main text)
Body:           14px Regular   (Secondary text)
Button:         16-18px Bold   (Action buttons)
Caption:        12px Regular   (Small labels)
Status Badge:   12px Bold      (Status pills)
```

---

## Component Spacing

```
Card Padding:      15-20px
Screen Padding:    20px
Section Margin:    15px vertical
Input Height:      50px
Button Height:     50px
Icon Size:         24px
Border Radius:     8-12px
Shadow Elevation:  2-4dp
```

---

## UI Components

### Status Badge
```
┌──────────────┐
│   PENDING    │  Orange background, white text
└──────────────┘

┌──────────────┐
│   ACCEPTED   │  Blue background, white text
└──────────────┘

┌──────────────┐
│  DELIVERED   │  Green background, white text
└──────────────┘
```

### Order Card
```
┌─────────────────────────────┐
│ Order #12345      [STATUS]  │  Header row
│ Customer Name               │
│                             │
│ 📍 Delivery Address         │  Info section
│ 📦 3 items - $299.00        │
│                             │
│ ┌─────────────────────────┐ │
│ │    Accept Order         │ │  Action button
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Input Field
```
┌─────────────────────────────┐
│ Placeholder text            │  White bg, gray border
└─────────────────────────────┘
```

### Button States
```
Normal:   ████████ Green #4CAF50
Pressed:  ████████ Darker green
Disabled: ████████ Gray with 60% opacity
```

---

## Navigation Flow

```
┌──────────────┐
│   Login      │
│   Screen     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Orders     │◄──────────────┐
│   Screen     │               │
└──────┬───────┘               │
       │                       │
       ├──────────────┐        │
       │              │        │
       ▼              ▼        │
┌──────────────┐ ┌──────────┐ │
│ Order        │ │ Tracking │ │
│ Details      │ │ Screen   │ │
└──────────────┘ └──────────┘ │
       │                      │
       └──────────────────────┘
```

---

## User Flow Diagram

```
Rider Opens App
      ↓
Login Screen
      ↓
Enter Credentials → Validate → Success
      ↓                    ↓
   Error              Orders Dashboard
   Alert                   ↓
                      View Assigned Orders
                            ↓
                    ┌───────┴───────┐
                    │               │
              Tap Order      Pull to Refresh
                    │               │
                    ▼               ▼
              Order Details    Reload Data
                    │
                    ├────→ Accept Order
                    │         ↓
                    │      Update Status
                    │
                    ├────→ Mark Delivered
                    │         ↓
                    │      Complete Order
                    │
                    └────→ Go to Tracking
                              ↓
                        Start GPS Tracking
                              ↓
                        Send Location (5s)
```

---

## Animation Specifications

### Button Press
- Duration: 150ms
- Effect: Scale down to 0.95
- Easing: Ease-in-out

### Card Shadow
- Normal: elevation 3
- Pressed: elevation 5

### Screen Transition
- Type: Slide from right
- Duration: 300ms
- iOS: Native slide animation

### Pull to Refresh
- Trigger: Pull down 100px
- Animation: Spinner
- Refresh: Fetch data

---

This mockup guide helps visualize the final app appearance and ensures consistent design implementation.
