/**
 * Read-only AI usage data for the Overview view. Off WPCOM the endpoint
 * proxies to WordPress.com server-side, so loading/error states matter here.
 * The wordpress-com/plans store fetches the same endpoint but swallows
 * failures (its catch only logs), so the fetch stays local until the store
 * exposes an error state the card's error notice can render.
 */

import {
	PLAN_TYPE_FREE,
	usePlanType as getPlanType,
} from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const ENDPOINT = '/wpcom/v2/jetpack-ai/ai-assistant-feature';

/**
 * Pin a date string without timezone information to UTC.
 *
 * @param {string} value - Date string, e.g. "2026-09-01" or "2026-09-01 00:00:00".
 * @return {string} The same instant with an explicit UTC offset.
 */
export function anchorDateToUtc( value ) {
	// Only the two shapes the endpoint is known to send are anchored; anything
	// else passes through untouched rather than risk assembling a bad string.
	if (
		typeof value !== 'string' ||
		! /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}:\d{2})?$/.test( value )
	) {
		return value;
	}
	const [ date, time = '00:00:00' ] = value.split( /[ T]/ );
	return `${ date }T${ time }+00:00`;
}

/**
 * Normalize the ai-assistant-feature payload for display, with the live
 * entitlement as the only source of truth (billing metadata can lag behind
 * migrations). The product has two states: Free gets a meter and an upgrade
 * offer; any paid plan gets nothing — nothing to meter, no higher tier to
 * sell. The i4 card shows what is AVAILABLE (limit − used), so that is
 * derived here.
 *
 * @param {object} data - Raw endpoint payload (dash-cased keys).
 * @return {object} { isFree, requestsCount, requestsLimit, requestsAvailable, showUpgrade }
 */
export function normalizeUsage( data ) {
	const planType = getPlanType( data?.[ 'current-tier' ] ?? null );
	// A payload that doesn't positively identify the free tier gets no card
	// rather than a guessed meter.
	const isFree = planType === PLAN_TYPE_FREE;

	const requestsCount = ( isFree ? data?.[ 'requests-count' ] : null ) ?? null;
	const requestsLimit = ( isFree ? data?.[ 'requests-limit' ] : null ) ?? null;
	const requestsAvailable =
		requestsCount !== null && requestsLimit !== null
			? Math.max( 0, requestsLimit - requestsCount )
			: null;

	return {
		isFree,
		requestsCount,
		requestsLimit,
		requestsAvailable,
		// Free is upgradable by definition, whatever the payload says about tiers.
		showUpgrade: isFree,
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
