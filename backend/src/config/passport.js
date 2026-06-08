import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,

      // Use .env value
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(
            new Error("Google account email not found"),
            null
          );
        }

        // Check existing user
        let user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        // Create user if not found
        if (!user) {
          user = await prisma.user.create({
            data: {
              name: profile.displayName,
              email,
              googleId: profile.id,
               // dummy password for Google users
              password_hash: "GOOGLE_AUTH_USER",
            },
          });
        }

        return done(null, user);

      } catch (error) {
        console.error(
          "Google Authentication Error:",
          error
        );

        return done(error, null);
      }
    }
  )
);

/**
 * Session Handling
 */

passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser(
  async (userId, done) => {
    try {

      const user =
        await prisma.user.findUnique({
          where: {
            user_id: userId,
          },
        });

      done(null, user);

    } catch (error) {

      done(error, null);

    }
  }
);

export default passport;