import type { APIRoute } from 'astro'
import { DatabaseSync } from 'node:sqlite';

const database = new DatabaseSync('database.sqlite');


const initDatabase = `
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS todos (
  todo_id TEXT PRIMARY KEY,
  todo_owner TEXT NOT NULL, 
  title TEXT NOT NULL,
  checked INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  checked_at INTEGER,
  FOREIGN KEY (todo_owner) REFERENCES users (user_id)
);
`;

database.exec(initDatabase);



export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({
      greeting: 'Hello',
    }),
  )
}





export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();

    if (!body || body.trim() === '') {
      return new Response(JSON.stringify({ error: 'Empty request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let data;
    try {
      data = JSON.parse(body);
    } catch (parseError) {
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(data)
    // If parsing succeeds, return a success response (customize as needed)
    return new Response(JSON.stringify({
      message: 'Request processed successfully',
      data: data
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  }
  catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

};