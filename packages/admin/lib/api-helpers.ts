import { NextResponse } from "next/server";

/**
 * Returns a JSON success response.
 */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Returns a JSON error response with a human-readable English message.
 */
export function err(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** 401 Unauthorized */
export function unauthorized(): NextResponse {
  return err("Unauthorized", 401);
}

/** 403 Forbidden */
export function forbidden(): NextResponse {
  return err("Forbidden", 403);
}

/** 404 Not Found */
export function notFound(): NextResponse {
  return err("Not found", 404);
}

/** 500 Internal Server Error */
export function serverError(detail?: string): NextResponse {
  return err(detail ?? "Internal server error", 500);
}
