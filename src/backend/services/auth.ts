import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from './db';

// User type matching our database schema
interface User {
  id: number;
  google_id: string;
  email: string;
  display_name: string;
  profile_picture: string | null;
}

// Configure Google OAuth Strategy
export function configureAuth() {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/google/callback';

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('WARNING: Google OAuth credentials not configured. Authentication will not work.');
    console.warn('Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value || '';
          const displayName = profile.displayName || '';
          const profilePicture = profile.photos?.[0]?.value || null;

          // Check if user exists
          let result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);

          if (result.rowCount === 0) {
            // Create new user
            result = await pool.query(
              'INSERT INTO users (google_id, email, display_name, profile_picture) VALUES ($1, $2, $3, $4) RETURNING *',
              [googleId, email, displayName, profilePicture]
            );
          } else {
            // Update existing user info
            result = await pool.query(
              'UPDATE users SET email = $1, display_name = $2, profile_picture = $3 WHERE google_id = $4 RETURNING *',
              [email, displayName, profilePicture, googleId]
            );
          }

          const user = result.rows[0] as User;
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize user to session
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        return done(null, false);
      }
      done(null, result.rows[0] as User);
    } catch (error) {
      done(error);
    }
  });
}

export default passport;
