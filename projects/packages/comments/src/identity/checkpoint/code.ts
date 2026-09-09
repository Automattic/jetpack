import { signal } from '@preact/signals';
import type { CurrentUser } from '../../shared/types';

/**
 * The one-time code WordPress.com handed back, held in sessionStorage until a
 * comment carries it. It has to outlive the page: an accepted comment
 * redirects, and a rejected one lands on an error page and comes back.
 */

export type HeldCode = {
	code: string;
	provider: string;
	name: string;
	avatar: string;
	/** Ms since epoch. */
	expires: number;
	/** A submit has carried it, so it is spent whatever the outcome. */
	spent: boolean;
};

const KEY = 'jetpack-comment-identity';

/**
 * WordPress.com keeps a code for an hour; a little less here so one about to
 * lapse is refreshed before the comment goes rather than rejected after.
 */
const HOLD_MS = 55 * 60 * 1000;

/**
 * Read the held code back, dropping one that has lapsed.
 *
 * @return The held code, or null.
 */
function read(): HeldCode | null {
	try {
		const raw = sessionStorage.getItem( KEY );
		if ( ! raw ) {
			return null;
		}

		const held = JSON.parse( raw ) as HeldCode;
		if ( ! held?.code || held.expires <= Date.now() ) {
			sessionStorage.removeItem( KEY );
			return null;
		}

		return held;
	} catch {
		return null;
	}
}

/**
 * Persist the signal's value.
 *
 * @param held - The held code, or null to drop it.
 */
function write( held: HeldCode | null ) {
	try {
		if ( held ) {
			sessionStorage.setItem( KEY, JSON.stringify( held ) );
		} else {
			sessionStorage.removeItem( KEY );
		}
	} catch {
		// Without storage the code lives as long as the page does.
	}
}

export const heldCode = signal< HeldCode | null >( read() );

/**
 * Hold a code WordPress.com just issued.
 *
 * @param held - Everything but the timing.
 */
export function holdCode( held: Omit< HeldCode, 'expires' | 'spent' > ) {
	const value = { ...held, expires: Date.now() + HOLD_MS, spent: false };
	heldCode.value = value;
	write( value );
}

/**
 * Note that a submit has carried the code.
 */
export function markCodeSpent() {
	const held = heldCode.peek();
	if ( held && ! held.spent ) {
		const value = { ...held, spent: true };
		heldCode.value = value;
		write( value );
	}
}

/**
 * Forget the held code.
 */
export function dropCode() {
	heldCode.value = null;
	write( null );
}

/**
 * Whether the code must be replaced before a comment carries it.
 *
 * @param held - The held code.
 * @return Whether to re-connect first.
 */
export function needsFreshCode( held: HeldCode ): boolean {
	return held.spent || held.expires - Date.now() < 60 * 1000;
}

/**
 * The "Commenting as …" attribution for a held code.
 *
 * @param held - The held code.
 * @return The attribution to show.
 */
export function attribution( held: Pick< HeldCode, 'provider' | 'name' | 'avatar' > ): CurrentUser {
	const { checkpoint, strings } = JetpackComments;
	const providerName = checkpoint.enabled
		? checkpoint.providers.find( p => p.id === held.provider )?.name
		: undefined;

	const name = held.name || providerName || held.provider;

	return {
		avatarUrl: held.avatar,
		// A function replacement, so a name containing `$1` or `$&` is not
		// treated as a replacement pattern.
		commentingAs: strings.commentingAs.replace( /%(1\$)?s/, () => name ),
		isPassport: true,
	};
}
