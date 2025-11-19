import { ObjectId } from "mongodb";
import { connectDB } from "../lib/mongodb";

const COLLECTION = "lectures";

export async function insertLecture({ title, subject, youtubeLink, uploadedAt = new Date() }) {
  const db = await connectDB();
  const doc = { title, subject, youtubeLink, uploadedAt };
  const result = await db.collection(COLLECTION).insertOne(doc);
  return await db.collection(COLLECTION).findOne({ _id: result.insertedId });
}

export async function getLectureById(id) {
  const db = await connectDB();
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  return db.collection(COLLECTION).findOne({ _id });
}

export async function getLectures(filter = {}, options = {}) {
  const db = await connectDB();
  return db.collection(COLLECTION).find(filter, options).toArray();
}

export async function updateLecture(id, update) {
  const db = await connectDB();
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  await db.collection(COLLECTION).updateOne({ _id }, { $set: update });
  return db.collection(COLLECTION).findOne({ _id });
}

export async function deleteLecture(id) {
  const db = await connectDB();
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  const res = await db.collection(COLLECTION).deleteOne({ _id });
  return res.deletedCount === 1;
}

export default {
  insertLecture,
  getLectureById,
  getLectures,
  updateLecture,
  deleteLecture,
};
