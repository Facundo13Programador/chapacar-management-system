import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    refreshToken: {
      type: String,
      default: "",
    },
  })

const Session = mongoose.model("session", sessionSchema);
export default Session;