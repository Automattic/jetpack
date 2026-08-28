import { signal } from '@preact/signals';
import { attribution, dropCode, heldCode } from '../identity/checkpoint/code';
import type { CurrentUser } from './types';

/**
 * Who the comment is attributed to on first paint. The server's word wins: a
 * logged-in reader, or one whose Passport it recognised, is who they say, and
 * any code this tab still holds has done its job. Otherwise a held code is a
 * sign-in the server has not seen yet, and the attribution rides with it.
 *
 * @return The attribution, or null for a guest.
 */
function initialUser(): CurrentUser | null {
	if ( JetpackComments.user ) {
		dropCode();
		return JetpackComments.user;
	}

	const held = heldCode.peek();

	return held ? attribution( held ) : null;
}

/**
 * Who the comment is attributed to, page-wide. A viewer has one identity, not
 * one per form, so every form shares this signal. connect.ts updates it.
 */
export const identityUser = signal< CurrentUser | null >( initialUser() );

/**
 * Whether a sign-in is in flight, page-wide. Feeds the submit button so a
 * comment can't be sent mid-authentication; the per-button spinner stays local.
 */
export const isConnecting = signal< boolean >( false );
