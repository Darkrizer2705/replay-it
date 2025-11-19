import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req) {
  try {
    const db = await connectDB();
    const body = await req.json();

    // Support bulk POST (array) or single object
    if (Array.isArray(body)) {
      const docs = body.map((item) => ({
        title: item.title,
        subject: item.subject,
        youtubeLink: item.youtubeLink,
        uploadedAt: item.uploadedAt ? new Date(item.uploadedAt) : new Date(),
      }));

      const result = await db.collection("lectures").insertMany(docs);
      const insertedIds = Object.values(result.insertedIds).map((id) => new ObjectId(id));
      const inserted = await db
        .collection("lectures")
        .find({ _id: { $in: insertedIds } })
        .toArray();

      return new Response(JSON.stringify({ success: true, lectures: inserted }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const doc = {
      title: body.title,
      subject: body.subject,
      youtubeLink: body.youtubeLink,
      uploadedAt: body.uploadedAt ? new Date(body.uploadedAt) : new Date(),
    };

    const result = await db.collection("lectures").insertOne(doc);
    const inserted = await db.collection("lectures").findOne({ _id: result.insertedId });

    return new Response(JSON.stringify({ success: true, lecture: inserted }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}

export async function GET() {
  try {
    const db = await connectDB();
    const lectures = await db.collection("lectures").find({}).sort({ uploadedAt: -1 }).toArray();
    return new Response(JSON.stringify(lectures), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}
