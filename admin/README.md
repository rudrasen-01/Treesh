# Trees Admin Panel 🌳

A comprehensive admin panel for the Trees Social Media Platform with PSA management, analytics dashboard, and user administration features.

## 🚀 Features

### 📢 PSA Management
- Create and manage Public Service Announcements
- PSA announcements automatically appear in all user feeds
- Real-time PSA analytics and engagement tracking
- Priority-based PSA scheduling

### 📊 Analytics Dashboard
- Real-time user metrics and growth analytics
- Interactive data visualizations
- User engagement statistics
- Platform performance monitoring

### 👥 User Management
- Admin user authentication and authorization
- User oversight and moderation tools
- Account management and verification

### 🎨 Modern UI/UX
- Responsive design built with React and TypeScript
- Tailwind CSS for modern styling
- shadcn/ui component library
- Clean, intuitive admin interface

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Lucide React** for icons

### Backend Integration
- **Node.js/Express** API integration
- **MongoDB Atlas** database
- **JWT** authentication
- **RESTful API** architecture

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account
- Trees backend API running

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/techsavvyanuj/trees-admin.git
   cd trees-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

### Windows
```bash
deploy-admin.bat
```

### Linux/Mac
```bash
./deploy-admin.sh
```

### Manual Setup
```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
```

The build output will be in the `dist` folder.

## Deployment

Deploy the `dist` folder to any static hosting service:
- Netlify
- Vercel
- AWS S3
- GitHub Pages

For detailed deployment instructions, see [ADMIN_PANEL_DEPLOYMENT.md](ADMIN_PANEL_DEPLOYMENT.md).
