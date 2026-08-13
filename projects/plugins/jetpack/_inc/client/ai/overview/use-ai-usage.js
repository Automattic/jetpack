/**
 * Read-only AI usage data for the Overview view. Off WPCOM the endpoint
 * proxies to WordPress.com server-side, so loading/error states matter here.
 */

import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const ENDPOINT = '/wpcom/v2/jetpack-ai/ai-assistant-feature';

// Tier `value` semantics, mirroring shared-extension-utils' usePlanType:
// 0 = free, 1 = the legacy unlimited plan, anything else = a tiered plan.
const TIER_VALUE_FREE = 0;
const TIER_VALUE_UNLIMITED = 1;

/**
 * Normalize the ai-assistant-feature payload for display, following
 * ai-client's free/tiered/unlimited rules. The i4 card shows what is
 * AVAILABLE (limit − used), so that is derived here.
 *
 * @param {object} data - Raw endpoint payload (dash-cased keys).
 * @return {object} { unlimited, isFree, requestsCount, requestsLimit, requestsAvailable, renewsOn, planLabel, showUpgrade }
 */
export function normalizeUsage( data ) {
	const currentTier = data?.[ 'current-tier' ] ?? null;
	const unlimited = currentTier?.value === TIER_VALUE_UNLIMITED;
	const isFree = currentTier?.value === TIER_VALUE_FREE;

	let requestsCount = null;
	let requestsLimit = null;
	if ( ! unlimited ) {
		requestsCount =
			( isFree ? data?.[ 'requests-count' ] : data?.[ 'usage-period' ]?.[ 'requests-count' ] ) ??
			null;
		requestsLimit =
			( isFree ? data?.[ 'requests-limit' ] : currentTier?.limit || data?.[ 'requests-limit' ] ) ??
			null;
	}
	const requestsAvailable =
		requestsCount !== null && requestsLimit !== null
			? Math.max( 0, requestsLimit - requestsCount )
			: null;

	const renewsOn = data?.[ 'usage-period' ]?.[ 'next-start' ] ?? null;

	const showUpgrade =
		! unlimited &&
		( Boolean( data?.[ 'next-tier' ] ) || data?.[ 'site-require-upgrade' ] === true );

	// Fallback when the page data has no purchase name: the tier's own
	// readable limit when it ships one (dash-case wire key; camelCase covers
	// the older TS typings), else the plan's nature.
	let planLabel = null;
	if ( isFree ) {
		planLabel = __( 'Free', 'jetpack' );
	} else if ( currentTier ) {
		planLabel =
			currentTier[ 'readable-limit' ] ??
			currentTier.readableLimit ??
			( unlimited ? __( 'Unlimited', 'jetpack' ) : String( currentTier.limit ?? '' ) );
	}

	return {
		unlimited,
		isFree,
		requestsCount,
		requestsLimit,
		requestsAvailable,
		renewsOn,
		planLabel,
		showUpgrade,
	};
}

/**
 * Fetch the AI usage data once on mount.
 *
 * @return {object} { isLoading, data, error }
 */
export function useAiUsage() {
	const [ isLoading, setIsLoading ] = useState( true );
	const [ data, setData ] = useState( null );
	const [ error, setError ] = useState( null );

	useEffect( () => {
		let cancelled = false;
		setIsLoading( true );
		apiFetch( { path: ENDPOINT } )
			.then( response => {
				if ( ! cancelled ) {
					setData( response );
					setError( null );
				}
			} )
			.catch( err => {
				if ( ! cancelled ) {
					setError( err?.message ?? __( 'Failed to load AI usage data.', 'jetpack' ) );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setIsLoading( false );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [] );

	return { isLoading, data, error };
}
