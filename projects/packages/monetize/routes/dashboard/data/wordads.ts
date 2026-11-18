import { isSimpleSite } from '@automattic/jetpack-script-data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { wpcomFetch } from './wpcom-fetch';
import type { WpcomApiError } from './wpcom-request';

const ACCOUNT_KEY = [ 'monetize', 'ads', 'account' ];
export const ADS_MODULE_KEY = [ 'monetize', 'ads', 'module' ];

/** Why WordPress.com won't serve ads on the site, as `wordads/account` reports it. */
export type UnsafeReason = 'mature' | 'spam' | 'private' | 'other';

export interface AdsAccount {
	approved: boolean;
	active: boolean;
	unsafe: UnsafeReason | false;
	/** WordPress.com's program status, e.g. `ineligible` once the plan lapses; false if it has none. */
	status: string | false;
}

interface AccountResponse {
	approved?: boolean;
	active?: boolean;
	unsafe?: string | false;
	status?: string | false;
}

const UNSAFE_REASONS: readonly string[] = [ 'mature', 'spam', 'private', 'other' ];

/**
 * The site's WordAds approval, from WordPress.com.
 *
 * @return The query.
 */
export function useAdsAccount() {
	return useQuery< AccountResponse, WpcomApiError, AdsAccount >( {
		queryKey: ACCOUNT_KEY,
		queryFn: () => wpcomFetch( { api: 'rest/v1.1', path: 'wordads/account' } ),
		select: data => {
			let unsafe: UnsafeReason | false = false;
			if ( data.unsafe ) {
				unsafe = UNSAFE_REASONS.includes( data.unsafe ) ? ( data.unsafe as UnsafeReason ) : 'other';
			}
			return {
				approved: Boolean( data.approved ),
				active: Boolean( data.active ),
				unsafe,
				status: data.status || false,
			};
		},
	} );
}

/**
 * Whether ads are on: the `wordads` module on Jetpack sites, WordPress.com's own state on Simple.
 *
 * The Settings tab invalidates the module query when it switches the module.
 *
 * @return Whether ads are on, undefined while that loads, and whether it failed to.
 */
export function useAdsActive(): { active: boolean | undefined; isError: boolean } {
	const simple = isSimpleSite();
	const account = useAdsAccount();
	const module = useQuery( {
		queryKey: ADS_MODULE_KEY,
		queryFn: async () => {
			const settings = await apiFetch< { wordads?: unknown } >( { path: '/jetpack/v4/settings' } );
			return Boolean( settings.wordads );
		},
		enabled: ! simple,
	} );

	return simple
		? { active: account.data?.active, isError: account.isError }
		: { active: module.data, isError: module.isError };
}

/**
 * Joins WordAds on Simple. Jetpack sites have no join step: WordPress.com approves them once the module is on.
 *
 * @return The mutation.
 */
export function useJoinWordAds() {
	const queryClient = useQueryClient();
	return useMutation< unknown, WpcomApiError >( {
		mutationFn: () => wpcomFetch( { api: 'rest/v1.1', path: 'wordads/approve', method: 'POST' } ),
		onSettled: () => queryClient.invalidateQueries( { queryKey: ACCOUNT_KEY } ),
	} );
}

/** The payout state of a month's earnings, as WordPress.com numbers it. */
export type EarningStatus = 'unpaid' | 'paid' | 'internal' | 'missing-tax-info' | 'invalid-paypal';

const EARNING_STATUSES: Record< string, EarningStatus > = {
	0: 'unpaid',
	1: 'paid',
	2: 'internal',
	3: 'missing-tax-info',
	4: 'invalid-paypal',
};

export interface EarningsPeriod {
	/** `YYYY-MM`. */
	period: string;
	amount: number;
	/** Ads served, which WordPress.com only counts for ad network earnings. */
	adsServed: number | null;
	status: EarningStatus | null;
}

export interface AdsEarnings {
	total: number;
	owed: number;
	wordads: EarningsPeriod[];
	sponsored: EarningsPeriod[];
	adjustment: EarningsPeriod[];
}

type PeriodResponse = Record<
	string,
	{ amount?: number | string; pageviews?: number | string; status?: number | string }
>;

interface EarningsResponse {
	earnings?: {
		total_earnings?: number | string;
		total_amount_owed?: number | string;
		wordads?: PeriodResponse | unknown[];
		sponsored?: PeriodResponse | unknown[];
		adjustment?: PeriodResponse | unknown[];
	};
}

/**
 * One kind of earnings, newest month first. PHP sends an empty one as `[]`.
 *
 * @param periods - The API's months.
 * @return The months.
 */
function toPeriods( periods: PeriodResponse | unknown[] | undefined ): EarningsPeriod[] {
	if ( ! periods || Array.isArray( periods ) ) {
		return [];
	}
	return Object.entries( periods )
		.map( ( [ period, { amount, pageviews, status } ] ) => {
			const adsServed = Number( pageviews );
			return {
				period,
				amount: Number( amount ) || 0,
				adsServed: pageviews === undefined || Number.isNaN( adsServed ) ? null : adsServed,
				status: EARNING_STATUSES[ String( status ) ] ?? null,
			};
		} )
		.sort( ( a, b ) => b.period.localeCompare( a.period ) );
}

/**
 * The earnings in a `wordads/earnings` response.
 *
 * @param data - The response.
 * @return The earnings.
 */
export function toAdsEarnings( data: EarningsResponse ): AdsEarnings {
	const earnings = data.earnings ?? {};
	return {
		total: Number( earnings.total_earnings ) || 0,
		owed: Number( earnings.total_amount_owed ) || 0,
		wordads: toPeriods( earnings.wordads ),
		sponsored: toPeriods( earnings.sponsored ),
		adjustment: toPeriods( earnings.adjustment ),
	};
}

/**
 * What the site has earned from ads, all time and by month.
 *
 * @return The query.
 */
export function useAdsEarnings() {
	return useQuery< EarningsResponse, WpcomApiError, AdsEarnings >( {
		queryKey: [ 'monetize', 'ads', 'earnings' ],
		queryFn: () => wpcomFetch( { api: 'wpcom/v2', path: 'wordads/earnings' } ),
		select: toAdsEarnings,
	} );
}

export interface AdsPayment {
	id: number;
	/** The payout date, or its estimate while pending. */
	date: string;
	amount: number;
	/** `paid`, `pending` or `failed`, among others. */
	status: string;
	paypalEmail: string;
	description: string;
}

/**
 * The site's ad payouts.
 *
 * @return The query.
 */
export function useAdsPayments() {
	return useQuery<
		{ payments?: Array< Partial< Omit< AdsPayment, 'date' > > & { paymentDate?: string } > },
		WpcomApiError,
		AdsPayment[]
	>( {
		queryKey: [ 'monetize', 'ads', 'payments' ],
		queryFn: () => wpcomFetch( { api: 'wpcom/v2', path: 'wordads/payments' } ),
		select: data =>
			( data.payments ?? [] ).map( payment => ( {
				id: Number( payment.id ),
				date: payment.paymentDate ?? '',
				amount: Number( payment.amount ) || 0,
				status: payment.status ?? '',
				paypalEmail: payment.paypalEmail ?? '',
				description: payment.description ?? '',
			} ) ),
	} );
}
