// app/api/make-admin/route.js
// Temporary admin route - remove immediately after use.
//
// Usage: open in browser:
// https://YOUR-VERCEL-URL/api/make-admin?secret=YOUR_TEMP_SECRET&email=your_email@example.com
//
// IMPORTANT: set two Vercel Environment Variables first:
// DATABASE_URL  (your DB connection string)
// TEMP_ADMIN_SECRET  (a secret you will choose)

import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret');
    const email = url.searchParams.get('email');

    if (!secret || !email) {
      return NextResponse.json({ ok: false, error: 'missing secret or email' }, { status: 400 });
    }
    if (!process.env.TEMP_ADMIN_SECRET) {
      return NextResponse.json({ ok: false, error: 'TEMP_ADMIN_SECRET not set in env' }, { status: 500 });
    }
    if (secret !== process.env.TEMP_ADMIN_SECRET) {
      return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL not set in env' }, { status: 500 });
    }

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    // find user
    const userRes = await client.query('SELECT id, email FROM users WHERE email = $1 LIMIT 1', [email]);
    if (userRes.rowCount === 0) {
      await client.end();
      return NextResponse.json({ ok: false, error: 'user not found' }, { status: 404 });
    }
    const userId = userRes.rows[0].id;

    // Try to set role directly on users table
    try {
      await client.query("UPDATE users SET role = 'admin' WHERE id = $1", [userId]);
    } catch (e) {
      // if that fails, try inserting into user_roles join table
      try {
        // find admin role id if roles table exists
        const roleRow = await client.query("SELECT id FROM roles WHERE name = 'admin' LIMIT 1");
        if (roleRow.rowCount) {
          const roleId = roleRow.rows[0].id;
          await client.query("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [userId, roleId]);
        } else {
          // fallback to simple user_roles with role text
          await client.query("INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin')", [userId]);
        }
      } catch (err) {
        await client.end();
        return NextResponse.json({ ok: false, error: 'failed to update role: ' + err.message }, { status: 500 });
      }
    }

    await client.end();
    return NextResponse.json({ ok: true, message: 'user promoted to admin. Log out and log back in.' });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
