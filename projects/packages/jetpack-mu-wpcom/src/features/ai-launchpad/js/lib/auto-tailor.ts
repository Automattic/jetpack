import apiFetch from '@wordpress/api-fetch';
import { tailor } from './tailor.ts';
import type { SiteCopy, TailorResult, WizardInput } from './types.ts';
import type { LaunchpadData } from '../tailored-list/model.ts';

const ENDPOINT = '/wpcom/v2/ai-launchpad';
const CLAIM_PATH = `${ ENDPOINT }/auto-tailor-claim`;

/**
 * Free the automatic tailoring run if the page is left before it settles, so the next load
 * tailors without waiting out the claim.
 *
 * @param tailoring - The run this load claimed.
 * @return The same run.
 */
export function releaseClaimOnLeave< T extends { saveError?: unknown } >(
	tailoring: Promise< T >
): Promise< T > {
	if ( typeof window === 'undefined' ) {
		return tailoring;
	}
	const release = () => {
		apiFetch( { path: CLAIM_PATH, method: 'DELETE', keepalive: true } ).catch( () => {} );
	};
	window.addEventListener( 'pagehide', release );
	// Stay attached after a failed save: the server ignores the release once a list exists.
	tailoring.then(
		result => ! result?.saveError && window.removeEventListener( 'pagehide', release ),
		() => {}
	);
	return tailoring;
}

/** Injection points, so tests need no network or real timers. */
export interface WaitOptions {
	fetchData?: () => Promise< LaunchpadData >;
	tailorFn?: typeof tailor;
	sleep?: ( ms: number ) => Promise< unknown >;
	intervalMs?: number;
	maxPolls?: number;
	onTimeout?: () => void;
}

/**
 * Build the tailoring input an AI-built site skips the wizard with.
 *
 * @param data - The `GET /ai-launchpad` response.
 * @return The input, or null when the server inferred none for this load.
 */
export function buildAutoInput( data: LaunchpadData ): WizardInput | null {
	if ( ! data.inferred_input ) {
		return null;
	}
	const locale = data.site?.language || 'en';
	return { ...data.inferred_input, locale, ui_locale: data.user_language || locale };
}

/**
 * Wait for another load to finish tailoring this site's list.
 *
 * Takes over and tailors itself if a poll hands this load the input, which happens
 * when the other load's claim expires.
 *
 * @param copy    - The site copy to tailor with.
 * @param options - Injection points and poll limits.
 * @return The saved result, or this load's own when it took over; never settles after a timeout.
 */
export async function waitForTailoring(
	copy: SiteCopy,
	options: WaitOptions = {}
): Promise< TailorResult > {
	const {
		fetchData = () => apiFetch< LaunchpadData >( { path: `${ ENDPOINT }?auto_tailor=1` } ),
		tailorFn = tailor,
		sleep = ms => new Promise( resolve => setTimeout( resolve, ms ) ),
		intervalMs = 5000,
		maxPolls = 60,
		// Reloading re-runs the initial decision, which tailors or shows the wizard by then.
		onTimeout = () => window.location.reload(),
	} = options;

	for ( let poll = 0; poll < maxPolls; poll++ ) {
		await sleep( intervalMs );
		let data: LaunchpadData;
		try {
			data = await fetchData();
		} catch {
			// One failed poll must not end the wait; only maxPolls does.
			continue;
		}
		if ( data.ai_output ) {
			return {
				source: data.ai_output.source === 'fallback' ? 'fallback' : 'ai',
				output: data.ai_output.payload,
			};
		}
		const input = buildAutoInput( data );
		if ( input ) {
			return releaseClaimOnLeave( tailorFn( input, copy, true ) );
		}
	}
	onTimeout();
	return new Promise< TailorResult >( () => {} );
}
