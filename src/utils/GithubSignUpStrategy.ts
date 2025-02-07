import { Strategy as GithubStrategy } from "passport-github2";
import { signupWithGithub } from "../controllers/userController";
import passport from "passport";

export const GithubSignUpStrategy = new GithubStrategy(
  {
    clientID: process.env.GITHUB_SIGNUP_CLIENT_ID as string,
    clientSecret: process.env.GITHUB_SIGNUP_CLIENT_SECRET as string,
    callbackURL: process.env.GITHUB_SIGNUP_CALLBACK as string,
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
      const inviteToken = req.session.inviteToken;

      const user = await signupWithGithub(profile, inviteToken);

      if (!user) {
        return done(new Error("User not found"), null);
      }

      done(null, user);
    } catch (error: any) {
      done(null, false, { message: error.message });
    }
  }
);

passport.use("github-signup", GithubSignUpStrategy);
