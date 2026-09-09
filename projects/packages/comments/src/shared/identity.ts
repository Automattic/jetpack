import { signal } from '@preact/signals';
import { attribution, dropCode, heldCode } from '../identity/checkpoint/code';
import type { CurrentUser } from './types';

/**
 * Who the comment is attributed to on first paint. A site login wins outright.
 * Otherwise an unspent held code is a sign-in the server has not seen yet, and
 * beats the Passport it is about to replace; a spent one has done its job.
 *
 * @return The attribution, or null for a stranger.
 */
function initialUser(): CurrentUser | null {
	const { user } = JetpackComments;

	if ( user && ! user.isPassport ) {
		dropCode();
		return user;
	}

	const held = heldCode.peek();
	if ( held && ! held.spent ) {
		return attribution( held );
	}

	if ( user ) {
		dropCode();
		return user;
	}

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

/**
 * Whether the last sign-in attempt failed in a way worth apologising for.
 */
export const hasLoginFailed = signal< boolean >( false );
