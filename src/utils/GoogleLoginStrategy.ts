import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { loginWithGoogle } from "../controllers/userController";
import passport from "passport";

export const GoogleLoginStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_LOGIN_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_lOGIN_CLIENT_SECRET as string,
    callbackURL: process.env.GOOGLE_LOGIN_CALLBACK as string,
  },
  async (
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function
  ) => {
    try {
      const user = await loginWithGoogle(profile);

      if (!user) {
        return done(new Error("User not found"), null);
      }

      done(null, user);
    } catch (error: any) {
      done(null, false, { message: error.message });
    }
  }
);

passport.use("google-login", GoogleLoginStrategy);
