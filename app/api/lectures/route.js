import { connectDB } from "@/lib/mongodb";
import Lecture from "@/models/Lecture";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const newLecture = await Lecture.create(body);

    return Response.json({ success: true, lecture: newLecture });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: error.message });
  }
}

export async function GET() {
  try {
    await connectDB();
    const lectures = await Lecture.find().sort({ uploadedAt: -1 });
    return Response.json(lectures);
  } catch (error) {
    return Response.json({ error: error.message });
  }
}
