# Admin Panel Deployment Guide

This guide explains how to deploy the separated admin panel independently from the main application.

## Project Structure

The admin panel has been separated into its own folder structure:

```
src/
├── components/          # All admin-related components
├── hooks/              # Required hooks (useAuth, use-mobile)
├── services/           # Demo data services
├── lib/                # Utility functions
├── AdminApp.tsx        # Main admin application
├── main.tsx            # Entry point
├── index.html          # HTML template
└── index.css           # Styles
```

## Files for Deployment

1. **package.json** - Dependencies for admin panel
2. **vite.config.ts** - Vite configuration for admin panel
3. **tsconfig.json** - TypeScript configuration

## Deployment Steps

### 1. Install Dependencies

```bash
# Install dependencies
npm install
```

### 2. Build the Admin Panel

```bash
# Build the admin panel
npx vite build
```

### 3. Deploy

The build output will be in the `dist` folder, which you can deploy to any static hosting service:

- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Deploy the `dist` folder
- **AWS S3**: Upload contents of `dist` folder
- **GitHub Pages**: Use the `dist` folder as source

### 4. Environment Configuration

Make sure to set the appropriate environment variables for your deployment:

```bash
# Example environment variables
VITE_API_URL=your_api_endpoint
VITE_ADMIN_PANEL_URL=your_admin_panel_url
```

## Development

To run the admin panel in development mode:

```bash
# Run the admin panel in development mode
npx vite
```

The admin panel will run on the default Vite port (usually 5173).

## Features

The separated admin panel includes:

- **User Management**: View, edit, and manage user accounts
- **Content Moderation**: Moderate posts, comments, and media
- **Analytics & Reports**: View platform statistics and user reports
- **Live Stream Controls**: Manage live streaming features
- **PSA Management**: Handle public service announcements
- **Matchmaking Oversight**: Monitor and manage matching algorithms
- **Website Management**: Manage static pages and content
- **Admin Settings**: Configure admin panel and user permissions

## Security Notes

- The admin panel should be deployed on a separate domain/subdomain
- Implement proper authentication and authorization
- Use HTTPS in production
- Consider IP whitelisting for admin access
- Regular security audits are recommended

## Troubleshooting

### Common Issues

1. **Import Path Errors**: Make sure all relative imports are correct
2. **Missing Dependencies**: Ensure all required packages are installed
3. **Build Errors**: Check TypeScript configuration and Vite config
4. **Styling Issues**: Verify CSS and Tailwind imports are correct

### Support

For issues related to the admin panel deployment, check:
- Console errors in browser developer tools
- Build output in terminal
- Network requests and API endpoints
- Authentication and authorization setup
