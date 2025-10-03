# 📊 Daily Takings - Sales Tracking System

A modern, privacy-focused sales tracking application built with Astro, React, and TypeScript. Track your daily sales across multiple payment methods with automatic calculations, beautiful reports, and cloud backup integration.

## ✨ Features

### 📈 **Sales Management**
- **Multi-payment tracking** - Cash, Card, and Digital payments
- **Product-based sales** - Track individual products with quantities
- **Automatic calculations** - Real-time totals and summaries
- **Date-based organization** - Automatic file naming by date

### 💾 **Data Storage & Backup**
- **Local storage** - Uses Origin Private File System (OPFS) for secure local storage
- **Automatic backups** - Download JSON backups with one click
- **Google Drive sync** - Optional cloud backup integration
- **Data import/export** - Restore from backup files
- **Page close protection** - Prompts to backup before leaving

### 📱 **User Interface**
- **Responsive design** - Works on desktop, tablet, and mobile
- **Dark/light themes** - Adapts to system preferences
- **Real-time updates** - Instant calculations and feedback
- **Intuitive navigation** - Clean, modern interface with emoji icons

### 📄 **Reporting**
- **Beautiful reports** - Professional HTML reports with styling
- **PDF export** - Print-optimized layouts for physical copies
- **New tab viewing** - Open reports in separate windows
- **Multiple formats** - Web and print-friendly versions

### ☁️ **Cloud Integration** (Optional)
- **Google Drive sync** - Automatic backup to your Google Drive
- **Cloud restore** - Restore from any cloud backup
- **Multi-device access** - Access backups from anywhere
- **Secure authentication** - OAuth 2.0 with Google

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or later)
- npm or yarn

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/micrometre/daily_takings.git
   cd daily_takings
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:4321
   ```

## 🔧 Configuration

### Google Drive Integration (Optional)
To enable cloud backup sync with Google Drive:

1. **Get Google Cloud credentials** (see [Google Drive Setup Guide](./GOOGLE_DRIVE_SETUP.md))
2. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```
3. **Add your credentials**
   ```bash
   PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   PUBLIC_GOOGLE_API_KEY=your_google_api_key
   ```
4. **Restart the development server**

> **Note:** The app works perfectly without Google Drive integration. This is an optional feature for cloud backups.

## 📖 Usage Guide

### Adding Sales Data
1. **Navigate to Sales Entry** - Use the main page or `/sales`
2. **Add products** - Click "Add Product" and enter details
3. **Enter quantities** - Input cash, card, and digital payment quantities
4. **Save automatically** - Data is saved in real-time to local storage

### Managing Files
1. **Open sidebar** - Click the 📁 icon to view all sales files
2. **Select dates** - Choose any previous day's data to view/edit
3. **Export reports** - Use 🔗 for web view or 📄 for PDF
4. **Delete files** - Use 🗑️ to remove old data (with confirmation)

### Backup & Restore
1. **Local backup** - Click 💾 to download JSON backup
2. **Cloud sync** - Connect Google Drive for automatic cloud backups
3. **Restore data** - Use 📤 to restore from backup files
4. **Automatic prompts** - Get reminded to backup when closing the page

## 🏗️ Technical Architecture

### Frontend Stack
- **Astro** - Static site generator with island architecture
- **React** - Component library for interactive elements
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling

### Storage Solutions
- **OPFS (Origin Private File System)** - Secure local file storage
- **Google Drive API** - Optional cloud storage integration
- **JSON format** - Human-readable data format

### Key Components
- `SalesEntry.tsx` - Main sales input interface
- `SideNavigation.tsx` - File management and navigation
- `FileManager.tsx` - Data persistence and backup logic
- `GoogleDriveBackup.tsx` - Cloud integration (optional)

### Data Flow
```
User Input → React Components → FileManager → OPFS/Google Drive
     ↓
Real-time Updates → UI Components → User Feedback
```

## 📁 Project Structure

```
daily_takings/
├── src/
│   ├── components/          # React components
│   │   ├── SalesEntry.tsx   # Main sales input
│   │   ├── SideNavigation.tsx # File management
│   │   ├── FileManager.tsx  # Data persistence
│   │   └── GoogleDriveBackup.tsx # Cloud sync
│   ├── pages/              # Astro pages
│   │   ├── index.astro     # Home page
│   │   └── sales.astro     # Sales entry page
│   ├── types/              # TypeScript definitions
│   │   └── sales.ts        # Data types
│   └── utils/              # Utility functions
│       └── GoogleDriveAPI.ts # Google Drive integration
├── public/                 # Static assets
├── .env.example           # Environment variables template
├── GOOGLE_DRIVE_SETUP.md  # Cloud setup guide
└── README.md              # This file
```

## 🔒 Privacy & Security

### Data Privacy
- **Local-first approach** - All data stored locally by default
- **No external servers** - Direct client-to-cloud communication only
- **User-controlled backups** - You choose when and where to backup
- **No tracking** - No analytics or user tracking

### Security Features
- **OPFS isolation** - Data isolated per domain
- **OAuth 2.0** - Secure Google authentication
- **HTTPS only** - Encrypted communication with Google Drive
- **Client-side encryption** - Data processed locally

## 🛠️ Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Environment Variables
```bash
# Required for Google Drive integration
PUBLIC_GOOGLE_CLIENT_ID=your_client_id
PUBLIC_GOOGLE_API_KEY=your_api_key

# Alternative formats (for compatibility)
VITE_GOOGLE_CLIENT_ID=your_client_id
REACT_APP_GOOGLE_CLIENT_ID=your_client_id
```

### Browser Support
- **Modern browsers** with OPFS support
- **Chrome/Edge** 86+
- **Firefox** 111+
- **Safari** 15.2+

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
- **"Process is not defined" error** - Restart dev server after adding environment variables
- **Google Drive not working** - Check credentials in Google Cloud Console
- **Data not saving** - Ensure browser supports OPFS

### Getting Help
- Check the [Google Drive Setup Guide](./GOOGLE_DRIVE_SETUP.md)
- Review browser console for error messages
- Ensure you're using a supported browser

## 🎯 Roadmap

- [ ] **Multi-currency support** - Handle different currencies
- [ ] **Advanced reporting** - Charts and analytics
- [ ] **Team collaboration** - Share data between users
- [ ] **Mobile app** - Native mobile applications
- [ ] **API integrations** - Connect with accounting software

## 🙏 Acknowledgments

- **Astro team** - For the amazing static site generator
- **React team** - For the component library
- **Google** - For the Drive API and cloud storage
- **Tailwind CSS** - For the utility-first CSS framework

---

**Built with ❤️ for small businesses and entrepreneurs who need simple, reliable sales tracking.**