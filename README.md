# City Noise Pollution Mapper 🗺️🔊

A comprehensive React Native mobile app for crowdsourced noise pollution mapping and reporting. Built with Expo, TypeScript, custom Node.js backend with PostgreSQL, and modern React Native patterns.

## 🌟 Features

### Core Functionality
- **📍 GPS-Based Reporting**: One-tap noise reporting with automatic location detection
- **🔊 Real-time Noise Meter**: Built-in decibel meter using device microphone
- **🗺️ Interactive Maps**: Live map visualization of noise hotspots with Google Maps
- **📊 Dashboard**: Statistics overview with nearby reports and high noise areas
- **🔐 Secure Authentication**: JWT-based authentication with secure token storage

### Advanced Features
- **📱 Offline Support**: Queue reports for upload when connectivity returns
- **🔔 Push Notifications**: Alerts for nearby noise hotspots
- **📷 Media Attachments**: Photo support for noise reports
- **🔒 Privacy Controls**: Anonymous reporting option
- **🎨 Dark Mode**: Automatic theme switching based on system preference

## 🚀 Tech Stack

### Frontend (Mobile App)
- **React Native 0.81** with **Expo SDK 54**
- **TypeScript** for type safety
- **Expo Router** for file-based navigation
- **NativeWind** (Tailwind CSS for React Native)
- **Zustand** for state management
- **TanStack Query** for data fetching and caching

### Backend (API Server)
- **Node.js** with **Express** framework
- **PostgreSQL** database
- **Drizzle ORM** for type-safe database operations
- **JWT** for authentication
- **bcrypt** for password hashing

### Services & APIs
- **Google Maps API** for mapping functionality
- **Expo AV** for audio processing
- **Expo Location** for GPS services
- **Expo Notifications** for push notifications
- **Expo Image Picker** for media attachments

### Development Tools
- **ESLint** for code quality
- **TypeScript** for type checking
- **Jest** for testing
- **Expo EAS** for app store builds

## 🛠️ Setup & Installation

### Prerequisites
- **Node.js** 18+ and **npm/yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **PostgreSQL** 14+ for the backend database
- **Google Maps API Key**: [Google Cloud Console](https://console.cloud.google)

### 1. Clone & Install
```bash
git clone <repository-url>
cd NoiseMapper
```

### 2. Backend Setup

Navigate to the server directory and set up the backend:
```bash
cd server
npm install
```

Create a `.env.local` file in the server directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/noisemapper
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3001
```

Generate and run database migrations:
```bash
npm run db:generate
npm run db:migrate
```

Start the backend server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### 3. Frontend Setup

Navigate back to the root directory and install frontend dependencies:
```bash
cd ..
npm install
```

Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4. Development
```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

### 5. Build for Production
```bash
# Build for Android
npm run build:android

# Build for iOS (requires macOS)
npm run build:ios
```

## 📁 Project Structure

```
NoiseMapper/
├── app/                          # Expo Router app directory
│   ├── _layout.tsx              # Root layout with providers
│   ├── (tabs)/                  # Tab navigation
│   │   ├── _layout.tsx          # Tab layout
│   │   ├── index.tsx            # Dashboard screen
│   │   ├── map.tsx              # Map screen
│   │   ├── reports.tsx          # Reports screen
│   │   └── profile.tsx          # Profile screen
│   ├── auth/                    # Authentication screens
│   │   └── index.tsx            # Login/Signup screen
│   ├── report.tsx               # Report submission screen
│   └── providers/               # React context providers
│       └── ThemeProvider.tsx     # Theme management
├── components/                   # Reusable UI components
│   ├── AuthForm.tsx             # Authentication form
│   ├── AuthProvider.tsx         # Authentication context
│   ├── BrandLogo.tsx            # Logo component
│   ├── ConfigError.tsx          # Error display
│   ├── HotspotCard.tsx          # Noise report cards
│   ├── LoadingScreen.tsx        # Loading states
│   ├── MapFilters.tsx           # Map filtering controls
│   ├── NoiseMeter.tsx           # Real-time noise meter
│   ├── NoiceMap.tsx             # Map component
│   ├── QuickReportButton.tsx    # FAB for reporting
│   └── StatsCard.tsx            # Statistics display
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts               # Authentication logic
│   ├── useLocation.ts           # Location services
│   ├── useReports.ts            # Reports data management
│   └── useTheme.ts              # Theme management
├── lib/                         # Core utilities and services
│   ├── api.ts                   # API client with axios
│   ├── store.ts                 # Zustand store
│   ├── types.ts                 # TypeScript type definitions
│   └── utils.ts                 # Helper functions
├── constants/                   # App constants
│   └── Config.ts                # Configuration values
├── server/                      # Backend API server
│   ├── src/                     # Source code
│   │   ├── db/                  # Database schema and migrations
│   │   ├── middleware/          # Express middleware
│   │   ├── routes/              # API routes
│   │   └── index.ts             # Server entry point
│   ├── drizzle.config.ts        # Drizzle ORM configuration
│   ├── package.json             # Backend dependencies
│   └── README.md                # Backend documentation
├── theme/                       # Theme configuration
│   └── colors.ts                # Color definitions
├── utils/                       # Utility functions
│   └── notifications.tsx         # Notification utilities
├── assets/                      # Static assets
│   ├── logo.svg
│   ├── splash-icon.png
│   └── notification-icon.png
├── .env.example                 # Environment variables template
├── app.json                     # Expo configuration
├── package.json                 # Frontend dependencies
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## 🔧 Configuration

### Backend Configuration
The backend uses PostgreSQL with Drizzle ORM. Key tables:
- `users` - User profiles with authentication data
- `reports` - Noise pollution reports
- `user_sessions` - JWT session management

See `server/README.md` for detailed backend setup instructions.

### App Configuration
Update `constants/Config.ts` for:
- Google Maps API key
- Noise level thresholds
- Default map settings
- Feature flags

Environment variables for the frontend:
- `EXPO_PUBLIC_API_BASE_URL` - Backend API URL
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key

## 🎨 Design System

### Colors
- **Primary**: `#10B981` (Emerald Green)
- **Noise Levels**:
  - Low: `#10B981` (Green)
  - Moderate: `#F59E0B` (Yellow)
  - High: `#EF4444` (Red)

### Typography
- **Font**: Inter (loaded via expo-font)
- **Headings**: Bold, 24px
- **Body**: Regular, 16px

### Components
- **Cards**: Elevated with 12px border radius
- **Buttons**: Full-width with 12px border radius
- **Icons**: Material Icons throughout
- **Dark Mode**: Automatic based on system preference

## 🔐 Authentication

### Supported Methods
- **Email/Password**: Traditional sign up/sign in
- **Anonymous Reporting**: Privacy-focused reporting option

### Implementation
Uses custom JWT-based authentication with:
- JWT tokens for API access
- Secure token storage with Expo SecureStore
- Password hashing with bcrypt
- Automatic session management
- Protected routes for authenticated users

## 🗺️ Mapping Features

### Interactive Map
- **Provider**: Google Maps (via react-native-maps)
- **Features**:
  - Real-time user location tracking
  - Custom markers for noise reports
  - Color-coded markers based on noise level
  - Filter by noise type and decibel range

### Filtering
- **Noise Types**: Traffic, Construction, Events, Industrial, Other
- **Noise Levels**: Color-coded by severity (Green, Yellow, Orange, Red)

## 📊 Noise Reporting

### Report Flow
1. **Location**: Automatic GPS detection
2. **Measurement**: Real-time dB meter
3. **Categorization**: Select noise type
4. **Details**: Optional description and media
5. **Submission**: Review and submit

### Data Collection
- **GPS Coordinates**: Precise location data
- **Noise Level**: Decibel measurement
- **Noise Type**: Categorized source
- **Media**: Photos, videos, audio clips
- **Metadata**: Timestamp, device info

## 🔊 Noise Meter

### Technical Implementation
- **Audio API**: Expo AV for microphone access
- **Processing**: Real-time audio analysis
- **Calibration**: Reference measurements
- **Display**: Visual meter with level indicators

### Features
- **Real-time Display**: Live dB readings
- **Peak Detection**: Maximum noise levels
- **Health Warnings**: Risk level indicators
- **Recording States**: Visual feedback

## 📱 Offline Support

### Implementation
- **Storage**: AsyncStorage for local data
- **Queue Management**: Report queuing system
- **Sync**: Automatic upload when online
- **Conflict Resolution**: Duplicate detection

### Features
- **Background Sync**: Automatic data synchronization
- **Progress Tracking**: Upload status indicators
- **Error Handling**: Retry mechanisms
- **Storage Management**: Cleanup old data

## 🔔 Notifications

### Push Notifications
- **Nearby Hotspots**: Alerts for high-noise areas
- **Report Updates**: Status change notifications
- **Community Activity**: Discussion mentions
- **System Updates**: App maintenance alerts

### Implementation
- **Expo Notifications**: Cross-platform support
- **Permission Handling**: Graceful degradation
- **Scheduling**: Time-based delivery
- **Analytics**: Engagement tracking


## 🧪 Testing

### Test Coverage
```bash
# Run all tests
npm test

# Run specific test suites
npm test Auth
npm test Components
npm test Hooks
```

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: API and state management
- **E2E Tests**: Critical user flows
- **Performance Tests**: Map rendering and data loading

## 🚀 Deployment

### App Store Submission
1. **Build**: Generate production builds with EAS
2. **Assets**: Ensure all icons and splash screens
3. **Metadata**: App store descriptions and screenshots
4. **Review**: Apple/Google review process

### Updates
- **OTA Updates**: CodePush for instant updates
- **Version Management**: Semantic versioning
- **Rollout Strategy**: Phased release approach
- **Monitoring**: Crash reporting and analytics

## 📋 Development Guidelines

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

### Best Practices
- **Component Design**: Atomic design principles
- **State Management**: Zustand for global state
- **API Layer**: Consistent error handling
- **Performance**: Optimized rendering and memory usage

### Git Workflow
- **Branching**: Feature-based development
- **Commits**: Conventional commit format
- **PR Reviews**: Code review requirements
- **CI/CD**: Automated testing and deployment

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Contribution Guidelines
- Follow TypeScript and React best practices
- Add proper documentation for new features
- Ensure all tests pass
- Update README for significant changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Expo Team** for the amazing development platform
- **React Native Community** for excellent libraries
- **Google Maps** for mapping services
- **Open Source Contributors** for community support

## 📞 Support

For support and questions:
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@noisemapper.app

---

**Built with ❤️ for healthier, quieter cities**
