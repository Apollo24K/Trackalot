# Trackalot 🏷️

Trackalot is a Discord bot designed for contribution tracking and reward management for the server Taskalot. It provides a comprehensive stamp-based reward system with administrative tools, daily rewards, user profiles, and contribution tracking capabilities.

## Installation

### Prerequisites
- Node.js 16.9.0 or higher
- PostgreSQL database
- Discord Bot Token(s)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Apollo24K/Trackalot.git
   cd Trackalot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   TOKENS=your_discord_bot_token_here
   CLIENT_IDS=your_discord_client_id_here
   PREFIX=?
   PG_USER=your_postgres_username
   PG_DATABASE=trackalot
   PG_PASSWORD=your_postgres_password
   PG_PORT=5432
   RANK_AUTH=your_rank_auth_key
   ADMINS=user_id_1,user_id_2
   VERSION=0.1.0
   ```

4. **Database Setup**
   - Ensure PostgreSQL is running
   - The bot will automatically create necessary tables and extensions on startup
   - Required database: `trackalot` (or as specified in `PG_DATABASE`)

5. **Build the project**
   ```bash
   npm run build
   ```

6. **Start the bot**
   ```bash
   npm start
   ```
   or
   ```bash
   node .
   ```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -am 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Create a Pull Request

## License

This project is proprietary. All rights reserved.

## Support

For support and questions, contact the development team or create an issue in the repository.

---

**Note**: This bot requires proper PostgreSQL setup and Discord bot permissions. Ensure all environment variables are correctly configured before deployment.
