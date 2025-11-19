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

    let body;
    try {
      body = await req.json();
    } catch (err) {
      console.error('Invalid JSON payload', err && err.stack ? err.stack : err);
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (body == null) {
      return new Response(JSON.stringify({ ok: false, error: 'Empty request body' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const items = Array.isArray(body) ? body : [body];

    // Validate items
    const errors = [];
    items.forEach((item, idx) => {
      if (!item || typeof item !== 'object') {
        errors.push({ index: idx, error: 'Item must be an object' });
        return;
      }
      if (!item.title || typeof item.title !== 'string' || !item.title.trim()) {
        errors.push({ index: idx, error: 'Validation error: title required' });
      }
      // course or course_name is acceptable
      if (!item.course && !item.course_name) {
        errors.push({ index: idx, error: 'Validation error: course required (or course_name)' });
      }
      // url or youtubeLink optional but prefer url if present
    });

    if (errors.length) {
      return new Response(JSON.stringify({ ok: false, error: 'Validation failed', details: errors }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Normalize documents to store
    const docs = items.map((p) => {
      const courseKey = p.course || p.course_name || null;
      return {
        id: p.id !== undefined ? p.id : undefined,
        title: p.title,
        course: courseKey,
        course_name: p.course_name || undefined,
        url: p.url || p.youtubeLink || p.youtube_link || '',
        date: p.date || undefined,
        time: p.time || undefined,
        course_info: p.course_info || (courseKey ? { id: courseKey, name: p.course_name || courseKey } : undefined),
        raw: p,
        createdAt: new Date(),
      };
    });

    // Deduplicate based on `id` if provided
    const idsToCheck = docs.filter((d) => d.id !== undefined).map((d) => d.id);
    const existing = idsToCheck.length
      ? await db.collection('lectures').find({ id: { $in: idsToCheck } }).project({ id: 1 }).toArray()
      : [];
    const existingIds = new Set(existing.map((e) => e.id));

    const toInsert = docs.filter((d) => d.id === undefined || !existingIds.has(d.id));

    let inserted = [];
    if (toInsert.length > 0) {
      if (toInsert.length === 1) {
        const r = await db.collection('lectures').insertOne(toInsert[0]);
        const doc = await db.collection('lectures').findOne({ _id: r.insertedId });
        inserted = [doc];
      } else {
        const r = await db.collection('lectures').insertMany(toInsert);
        // fetch inserted docs
        const insertedIds = Object.values(r.insertedIds);
        inserted = await db
          .collection('lectures')
          .find({ _id: { $in: insertedIds } })
          .toArray();
      }
    }

    const response = {
      ok: true,
      inserted: inserted.length,
      duplicated: docs.length - toInsert.length,
      lectures: inserted,
    };

    const status = inserted.length > 0 ? 201 : 200;
    return new Response(JSON.stringify(response), {
      status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('POST /api/lectures error:', error && error.stack ? error.stack : error);
    return new Response(JSON.stringify({ ok: false, error: error.message || 'Server error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}

export async function GET() {
  try {
    const db = await connectDB();
    const lectures = await db.collection('lectures').find({}).sort({ createdAt: -1 }).toArray();
    // ensure array returned
    return new Response(JSON.stringify(lectures || []), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('GET /api/lectures error:', error && error.stack ? error.stack : error);
    return new Response(JSON.stringify({ ok: false, error: error.message || 'Server error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}
