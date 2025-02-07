import { Strategy as GithubStrategy } from "passport-github2";
import { loginWithGithub } from "../controllers/userController";
import passport from "passport";

export const GithubLoginStrategy = new GithubStrategy(
  {
    clientID: process.env.GITHUB_LOGIN_CLIENT_ID as string,
    clientSecret: process.env.GITHUB_LOGIN_CLIENT_SECRET as string,
    callbackURL: process.env.GITHUB_LOGIN_CALLBACK as string,
  },
  async (
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function
  ) => {
    try {
      const user = await loginWithGithub(profile);

      if (!user) {
        return done(new Error("User not found"), null);
      }

      done(null, user);
    } catch (error: any) {
      done(null, false, { message: error.message });
    }
  }
);

passport.use("github-signup", GithubLoginStrategy);
