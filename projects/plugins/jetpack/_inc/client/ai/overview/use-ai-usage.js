/**
 * Read-only AI usage data for the Overview view. Off WPCOM the endpoint
 * proxies to WordPress.com server-side, so loading/error states matter here.
 * The wordpress-com/plans store fetches the same endpoint but swallows
 * failures (its catch only logs), so the fetch stays local until the store
 * exposes an error state the card's error notice can render.
 */

import {
	PLAN_TYPE_FREE,
	PLAN_TYPE_UNLIMITED,
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
 * Normalize the ai-assistant-feature payload for display, following
 * ai-client's free/tiered/unlimited rules. The i4 card shows what is
 * AVAILABLE (limit − used), so that is derived here.
 *
 * @param {object} data - Raw endpoint payload (dash-cased keys).
 * @return {object} { unlimited, isFree, requestsCount, requestsLimit, requestsAvailable, showUpgrade }
 */
export function normalizeUsage( data ) {
	const currentTier = data?.[ 'current-tier' ] ?? null;
	const planType = getPlanType( currentTier );
	const unlimited = planType === PLAN_TYPE_UNLIMITED;
	const isFree = planType === PLAN_TYPE_FREE;
	// A payload without a tier can't be split into period-vs-limit halves, so
	// it reads the free-shape pair — a consistent count against its own limit.
	const useFreeCounts = isFree || ! currentTier;

	let requestsCount = null;
	let requestsLimit = null;
	if ( ! unlimited ) {
		requestsCount =
			( useFreeCounts
				? data?.[ 'requests-count' ]
				: data?.[ 'usage-period' ]?.[ 'requests-count' ] ) ?? null;
		requestsLimit =
			( useFreeCounts
				? data?.[ 'requests-limit' ]
				: currentTier?.limit || data?.[ 'requests-limit' ] ) ?? null;
	}
	const requestsAvailable =
		requestsCount !== null && requestsLimit !== null
			? Math.max( 0, requestsLimit - requestsCount )
			: null;

	// Free is upgradable by definition, whatever the payload says about tiers.
	const showUpgrade =
		! unlimited &&
		( isFree || Boolean( data?.[ 'next-tier' ] ) || data?.[ 'site-require-upgrade' ] === true );

	return {
		unlimited,
		isFree,
		requestsCount,
		requestsLimit,
		requestsAvailable,
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
