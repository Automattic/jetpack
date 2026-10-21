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
export function releaseClaimOnLeave< T >( tailoring: Promise< T > ): Promise< T > {
	if ( typeof window === 'undefined' ) {
		return tailoring;
	}
	const release = () => {
		apiFetch( { path: CLAIM_PATH, method: 'DELETE', keepalive: true } ).catch( () => {} );
	};
	window.addEventListener( 'pagehide', release );
	const stop = () => window.removeEventListener( 'pagehide', release );
	tailoring.then( stop, stop );
	return tailoring;
}

/** Injection points, so tests need no network or real timers. */
export interface WaitOptions {
	fetchData?: () => Promise< LaunchpadData >;
	tailorFn?: typeof tailor;
	sleep?: ( ms: number ) => Promise< unknown >;
	intervalMs?: number;
	maxPolls?: number;
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
 * @return The saved result, or this load's own when it took over.
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
	throw new Error( 'Timed out waiting for the site setup list.' );
}
