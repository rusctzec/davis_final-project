import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

let userSchema = new mongoose.Schema({
  registeredOn: {
    type: Date,
    default: new Date(),
    required: true,
  },
  lastLoggedIn: {
    type: Date,
    default: new Date(),
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9_-]+$/.test(v)
      },
      message: "Username must only contain alphanumeric characters, dashes, or underscores"
    }
  },
  email: {
    type: String,
  },
});

userSchema.plugin(passportLocalMongoose);

let User = new mongoose.model('User', userSchema);

export default User;
