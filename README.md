# City Noise Pollution Mapper 🗺️🔊

A comprehensive React Native mobile app for crowdsourced noise pollution mapping and reporting. Built with Expo, TypeScript, Supabase, and modern React Native patterns.

## 🌟 Features

### Core Functionality
- **📍 GPS-Based Reporting**: One-tap noise reporting with automatic location detection
- **🔊 Real-time Noise Meter**: Built-in decibel meter using device microphone
- **🗺️ Interactive Maps**: Live heatmap visualization of noise hotspots
- **📊 Data Analytics**: Comprehensive reporting and trend analysis
- **👥 Community Features**: Discussion threads and social sharing

### Advanced Features
- **📱 Offline Support**: Queue reports for upload when connectivity returns
- **🔔 Push Notifications**: Alerts for nearby noise hotspots
- **📷 Media Attachments**: Photo, video, and audio recording support
- **🔒 Privacy Controls**: Anonymous reporting and data encryption
- **📈 Data Export**: CSV/PDF reports for authorities and researchers

## 🚀 Tech Stack

### Frontend
- **React Native 0.81** with **Expo SDK 54**
- **TypeScript** for type safety
- **Expo Router** for file-based navigation
- **NativeWind** (Tailwind CSS for React Native)
- **Zustand** for state management
- **TanStack Query** for data fetching and caching

### Backend & Services
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **Google Maps API** for mapping functionality
- **Expo AV** for audio processing
- **Expo Location** for GPS services

### Development Tools
- **ESLint** for code quality
- **TypeScript** for type checking
- **Jest** for testing
- **Expo EAS** for app store builds

## 🛠️ Setup & Installation

### Prerequisites
- **Node.js** 18+ and **npm/yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Supabase Account**: [supabase.com](https://supabase.com)
- **Google Maps API Key**: [Google Cloud Console](https://console.cloud.google.com)

### 1. Clone & Install
```bash
git clone <repository-url>
cd noisemapper
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Supabase Setup
1. Create a new project on [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Enable Row Level Security (RLS) on all tables
4. Set up authentication providers (Email + Google OAuth)
5. Create storage bucket named 'media'

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
noisemapper/
├── app/                          # Expo Router app directory
│   ├── _layout.tsx              # Root layout with providers
│   ├── (tabs)/                  # Tab navigation
│   │   ├── _layout.tsx          # Tab layout
│   │   ├── index.tsx            # Dashboard screen
│   │   ├── map.tsx              # Map screen
│   │   ├── reports.tsx          # Reports screen
│   │   └── profile.tsx          # Profile screen
│   ├── report.tsx               # Report submission modal
│   └── +not-found.tsx           # Error screen
├── components/                   # Reusable UI components
│   ├── AuthProvider.tsx         # Authentication context
│   ├── LoadingScreen.tsx        # Loading states
│   ├── StatsCard.tsx            # Statistics display
│   ├── HotspotCard.tsx          # Noise report cards
│   ├── QuickReportButton.tsx    # FAB for reporting
│   ├── NoiseMeter.tsx           # Real-time noise meter
│   └── MapFilters.tsx           # Map filtering controls
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts               # Authentication logic
│   ├── useLocation.ts           # Location services
│   ├── useReports.ts            # Reports data management
│   └── useTheme.ts              # Theme management
├── lib/                         # Core utilities and services
│   ├── supabase.ts              # Supabase client & API
│   ├── store.ts                 # Zustand store
│   └── utils.ts                 # Helper functions
├── constants/                   # App constants
│   └── Config.ts                # Configuration values
├── assets/                      # Static assets
└── supabase-schema.sql          # Database schema
```

## 🔧 Configuration

### Supabase Schema
The complete database schema is in `supabase-schema.sql`. Key tables:
- `users` - User profiles
- `reports` - Noise pollution reports
- `hotspots` - Aggregated noise hotspots
- `discussions` - Community discussions

### App Configuration
Update `constants/Config.ts` for:
- Supabase credentials
- Google Maps API key
- Noise level thresholds
- Default map settings
- Feature flags

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
- **Google OAuth**: Social authentication
- **Anonymous**: Privacy-focused reporting

### Implementation
Uses Supabase Auth with:
- JWT tokens for API access
- Automatic session management
- Secure password policies
- Account recovery flows

## 🗺️ Mapping Features

### Interactive Map
- **Provider**: Google Maps (via react-native-maps)
- **Features**:
  - Real-time user location
  - Custom markers for noise reports
  - Heatmap visualization
  - Clustering for performance

### Filtering
- **Noise Types**: Traffic, Construction, Events, Industrial, Other
- **Decibel Range**: 0-120 dB with presets
- **Radius**: 1-25km from user location
- **Time Range**: Recent reports only

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

## 👥 Community Features

### Discussion System
- **Threaded Comments**: Per-report discussions
- **Moderation**: Community guidelines
- **Notifications**: Mention and reply alerts
- **Rich Media**: Image and link support

### Social Features
- **Sharing**: Report and hotspot sharing
- **Petitions**: Template-based advocacy
- **Leaderboards**: Community contribution tracking
- **Badges**: Achievement system

## 📈 Analytics & Export

### Data Export
- **CSV Reports**: Structured data export
- **PDF Summaries**: Visual report generation
- **Authority Integration**: Government portal uploads
- **Research Access**: Academic data sharing

### Analytics Dashboard
- **Usage Metrics**: App engagement data
- **Geographic Trends**: Noise pattern analysis
- **User Behavior**: Reporting patterns
- **Impact Assessment**: Policy effectiveness

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
- **Supabase** for the backend infrastructure
- **React Native Community** for excellent libraries
- **Open Source Contributors** for community support

## 📞 Support

For support and questions:
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@noisemapper.app

---

**Built with ❤️ for healthier, quieter cities**
