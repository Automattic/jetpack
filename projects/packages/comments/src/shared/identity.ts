import { signal } from '@preact/signals';
import type { CurrentUser } from './types';

/**
 * Who the comment is attributed to, page-wide. A viewer has one identity, not
 * one per form, so every form shares this signal. Seeded from the server value
 * for a correct first paint; connect.ts updates it.
 */
export const identityUser = signal< CurrentUser | null >( JetpackComments.user );

/**
 * Whether a sign-in is in flight, page-wide. Feeds the submit button so a
 * comment can't be sent mid-authentication; the per-button spinner stays local.
 */
export const isConnecting = signal< boolean >( false );
