# URL Shortener

A complete URL shortener service like Bit.ly with analytics and user authentication. This application allows you to create shortened URLs, track click analytics, and manage your links with a user-friendly dashboard.

## ✨ Features

- 🔗 **URL Shortening**: Create short, memorable links for any URL
- 📊 **Advanced Analytics**: Track clicks, browser usage, device types, referrers, and more
- 👤 **User Authentication**: Secure registration and login system
- 🔑 **API Access**: Generate API keys to integrate with other applications
- 🌐 **Custom URLs**: Create custom URL codes instead of random strings
- 🔒 **Password Protection**: Protect your links with password access
- ⏱️ **Link Expiration**: Set expiration dates for temporary links
- 🌟 **Public Directory**: Option to make links discoverable in a public directory
- 👑 **Admin Dashboard**: User management for administrators

## 🚀 Quick Start

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/Latex999/url-shortener.git
   cd url-shortener
   ```

2. Run the setup script (interactive):
   ```
   node setup.js
   ```
   
   This script will guide you through:
   - Setting up your environment variables
   - Configuring MongoDB connection
   - Creating an admin user
   - Installing dependencies

3. Start the application:
   ```
   npm start
   ```

4. Visit `http://localhost:3000` (or your configured port) in your browser.

### Manual Setup

If you prefer to configure manually:

1. Copy `.env.example` to `.env` and edit the values:
   ```
   cp .env.example .env
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the application:
   ```
   npm start
   ```

## 📱 Usage

### Creating a Short URL

1. Register or log in to your account
2. Click "Create URL" in the dashboard
3. Enter the long URL you want to shorten
4. Optionally:
   - Add a custom URL code
   - Set an expiration date
   - Add password protection
   - Make it public or private
5. Click "Create Short URL"

### Viewing Analytics

1. Go to your dashboard
2. Click the analytics icon next to any URL
3. View detailed statistics about clicks, browsers, operating systems, etc.

### Using the API

1. Generate an API key in your profile
2. Use the key in the HTTP header: `x-api-key: YOUR_API_KEY`
3. Make requests to `/api/shorten` to create new short URLs
4. See the API documentation at `/api` for more endpoints

## 🧰 API Endpoints

- `POST /api/shorten` - Create a short URL
- `GET /api/info/:code` - Get URL information
- `GET /api/urls` - List your URLs
- `GET /api/analytics/:code` - Get URL analytics
- `PUT /api/urls/:code` - Update a URL
- `DELETE /api/urls/:code` - Delete a URL

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Port for the server | 3000 |
| MONGODB_URI | MongoDB connection string | - |
| BASE_URL | Base URL for shortened links | http://localhost:3000 |
| SESSION_SECRET | Secret for session cookies | - |
| ADMIN_EMAIL | Email for initial admin user | - |
| ADMIN_PASSWORD | Password for initial admin user | - |
| RATE_LIMIT | API rate limit per 15 minutes | 100 |

## 📁 Project Structure

```
url-shortener/
├── config/             # Configuration files
├── middleware/         # Express middleware
├── models/             # MongoDB models
├── public/             # Static files
│   ├── css/            # Stylesheets
│   ├── js/             # Client-side JavaScript
├── routes/             # Express routes
├── views/              # EJS templates
├── .env.example        # Example environment variables
├── package.json        # Project dependencies
├── server.js           # Application entry point
└── setup.js            # Setup wizard
```

## 🔒 Security Features

- Password hashing with bcrypt
- Authentication with Passport.js
- Rate limiting for API and URL creation
- XSS protection through EJS templating
- API key authentication for programmatic access

## 🔄 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgements

- [Express.js](https://expressjs.com/) - Web framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Bootstrap](https://getbootstrap.com/) - Frontend framework
- [Chart.js](https://www.chartjs.org/) - Analytics visualizations
- [FontAwesome](https://fontawesome.com/) - Icons
- [EJS](https://ejs.co/) - Templating engine

---

Made with ❤️ by [Latex999](https://github.com/Latex999)