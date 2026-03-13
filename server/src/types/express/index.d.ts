// Augment Express Request with Supabase user
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}
