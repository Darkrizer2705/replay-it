import mongoose from "mongoose";

const LectureSchema = new mongoose.Schema({
  title: String,
  subject: String,
  youtubeLink: String,
  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Lecture || mongoose.model("Lecture", LectureSchema);
