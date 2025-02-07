import passport from "passport";

passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
  done(null, user);
});

passport.deserializeUser((user: any, done: (err: any, user?: any) => void) => {
  done(null, user);
});

export const PasspORt = passport;
