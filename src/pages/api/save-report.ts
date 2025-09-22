import type { APIRoute } from 'astro';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
      console.log(request)
    
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

    const { filename, content } = data;
    
    if (!filename || !content) {
      return new Response(JSON.stringify({ error: 'Missing filename or content' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Define the path to save the file
    const filePath = join(process.cwd(), 'src', 'content', 'daily-takings-data', filename);
    
    // Write the file
    await writeFile(filePath, content, 'utf-8');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Report saved as ${filename}`,
      path: `src/content/daily-takings-data/${filename}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error saving report:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to save report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};