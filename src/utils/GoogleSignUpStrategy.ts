import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { signupWithGoogle } from "../controllers/userController";
import passport from "passport";

export const GoogleSignUpStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_SIGNUP_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_SIGNUP_CLIENT_SECRET as string,
    callbackURL: process.env.GOOGLE_SIGNUP_CALLBACK as string,
    passReqToCallback: true,
  },
  async (
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function
  ) => {
    try {
      const userType = req.session.userType || "client";
      const inviteToken = req.session.inviteToken;

      const user = await signupWithGoogle(profile, userType, inviteToken);

      console.log("sign up with google calling");

      if (!user) {
        return done(new Error("User creation failed"), null);
      }

      done(null, user);
    } catch (error: any) {
      done(null, false, { message: error.message });
    }
  }
);

passport.use("google-signup", GoogleSignUpStrategy);
