declare module "h3" {
  interface H3EventContext {
    /** Set by server/middleware/auth.ts for every non-auth API request. */
    user?: SessionUser;
  }
}

export {};
