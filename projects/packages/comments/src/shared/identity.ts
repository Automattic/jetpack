import { signal } from '@preact/signals';
import { attribution, dropCode, heldCode } from '../identity/checkpoint/code';
import type { CurrentUser } from './types';

/**
 * Who the comment is attributed to on first paint. The server's word wins, and
 * any held code has then done its job; otherwise a held code is a sign-in the
 * server has not seen yet.
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
 * Who the comment is attributed to, page-wide; every form shares it.
 */
export const identityUser = signal< CurrentUser | null >( initialUser() );

/**
 * Whether a sign-in is in flight, page-wide. Holds the submit button.
 */
export const isConnecting = signal< boolean >( false );
