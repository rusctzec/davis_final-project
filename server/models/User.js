import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

let userSchema = new mongoose.Schema({
  registeredOn: {
    type: Date,
    default: new Date(),
  },
  lastLoggedIn: {
    type: Date,
    default: new Date(),
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
  },
});

userSchema.plugin(passportLocalMongoose);

let User = new mongoose.model('User', userSchema);

export default User;
