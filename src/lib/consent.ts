/**
 * Consent cookie names and shape.
 *
 * Kept out of the "use server" actions module: a server-actions file may only
 * export async functions, so exporting a constant from it silently strips
 * every export in the file.
 */

export const CONSENT_COOKIE = "aims_consent";
export const VISITOR_COOKIE = "aims_visitor";

export type ConsentChoice = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};
