import "dotenv/config";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma.js";

const googleCallbackUrl =
  process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/auth/google/callback";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: googleCallbackUrl,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          return done(new Error("Google account has no email"), null);
        }

        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        if (!user) {
          user = await prisma.user.findUnique({
            where: { email },
          });
        }

        if (!user) {
          user = await prisma.user.create({
            data: {
              name: profile.displayName || email,
              email,
              password_hash: "GOOGLE_AUTH_USER",
              googleId: profile.id,
            },
          });
        } else if (!user.googleId) {
          user = await prisma.user.update({
            where: { user_id: user.user_id },
            data: { googleId: profile.id },
          });
        } else if (user.email !== email) {
          const emailOwner = await prisma.user.findUnique({
            where: { email },
          });

          if (!emailOwner || emailOwner.user_id === user.user_id) {
            user = await prisma.user.update({
              where: { user_id: user.user_id },
              data: { email },
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.user_id));
passport.deserializeUser(async (id, done) => {
  const user = await prisma.user.findUnique({ where: { user_id: Number(id) } });
  done(null, user);
});

export default passport;
