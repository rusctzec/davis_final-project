const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
import { User } from './models';

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

export default passport;