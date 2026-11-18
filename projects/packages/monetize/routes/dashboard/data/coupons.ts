import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wpcomFetch } from './wpcom-fetch';

const COUPONS_KEY = [ 'monetize', 'memberships', 'coupons' ];

export interface Coupon {
	id: number;
	code: string;
	discountType: 'percentage' | 'amount';
	/** A percentage for a percentage discount, else an amount in `currency`. */
	discount: number;
	currency: string;
	/** `Y-m-d`. */
	startDate: string;
	/** `Y-m-d`, or empty when the coupon never expires. */
	endDate: string;
	/** Months the discount lasts once applied, or null for forever. */
	months: number | null;
	canBeCombined: boolean;
	firstTimeOnly: boolean;
	/** How many times each customer can use it, or null for no limit. */
	limitPerUser: number | null;
	/** Emails allowed to use it, `*` matching anything; empty for anyone. */
	emails: string[];
	/** Products it applies to; empty for all of them. */
	planIds: number[];
}

interface CouponResponse {
	id?: number | string;
	coupon_code?: string;
	discount_type?: string;
	discount_value?: number | string | null;
	discount_percentage?: number | string | null;
	discount_currency?: string | null;
	start_date?: string | null;
	end_date?: string | null;
	duration?: string | null;
	can_be_combined?: boolean;
	first_time_purchase_only?: boolean;
	limit_per_user?: number | string | null;
	email_allow_list?: string[] | null;
	plan_ids_allow_list?: Array< number | string > | null;
}

/**
 * A coupon as the API sends it, as Calypso's `membershipCouponFromApi()` reads it.
 *
 * @param coupon - The API's coupon.
 * @return The coupon.
 */
export function toCoupon( coupon: CouponResponse ): Coupon {
	const isPercentage = coupon.discount_type === 'percentage';
	// WordPress.com sends the duration as `<n> months`.
	const months = parseInt( coupon.duration ?? '', 10 );
	const limitPerUser = Number( coupon.limit_per_user );

	return {
		id: Number( coupon.id ),
		code: coupon.coupon_code ?? '',
		discountType: isPercentage ? 'percentage' : 'amount',
		discount: Number( isPercentage ? coupon.discount_percentage : coupon.discount_value ) || 0,
		currency: coupon.discount_currency || 'USD',
		startDate: coupon.start_date ?? '',
		endDate: coupon.end_date ?? '',
		months: months > 0 ? months : null,
		canBeCombined: Boolean( coupon.can_be_combined ),
		firstTimeOnly: Boolean( coupon.first_time_purchase_only ),
		limitPerUser: limitPerUser > 0 ? limitPerUser : null,
		emails: coupon.email_allow_list ?? [],
		planIds: ( coupon.plan_ids_allow_list ?? [] ).map( Number ),
	};
}

/**
 * The site's coupons.
 *
 * @return The query.
 */
export function useCoupons() {
	return useQuery( {
		queryKey: COUPONS_KEY,
		queryFn: () =>
			wpcomFetch< CouponResponse[] >( { api: 'wpcom/v2', path: 'memberships/coupons' } ),
		select: data => ( Array.isArray( data ) ? data : [] ).map( toCoupon ),
	} );
}

/**
 * Deletes a coupon.
 *
 * @return The mutation.
 */
export function useDeleteCoupon() {
	const queryClient = useQueryClient();
	return useMutation( {
		mutationFn: ( id: number ) =>
			wpcomFetch( { api: 'wpcom/v2', path: `memberships/coupon/${ id }`, method: 'DELETE' } ),
		onSettled: () => queryClient.invalidateQueries( { queryKey: COUPONS_KEY } ),
	} );
}

/**
 * A coupon as WordPress.com creates or updates it.
 */
export interface CouponPayload {
	coupon_code: string;
	discount_type: 'percentage' | 'amount';
	discount_percentage?: number;
	discount_value?: number;
	discount_currency?: string;
	start_date: string;
	end_date: string;
	/** `<n> months`, or empty for forever. */
	duration: string;
	/** Left out for no limit, since WordPress.com rejects 0. */
	limit_per_user?: number;
	can_be_combined: boolean;
	first_time_purchase_only: boolean;
	plan_ids_allow_list: number[];
	email_allow_list: string[];
}

/**
 * Creates a coupon, or updates one when given its ID.
 *
 * @return The mutation.
 */
export function useSaveCoupon() {
	const queryClient = useQueryClient();
	return useMutation( {
		mutationFn: ( { payload, id }: { payload: CouponPayload; id?: number } ) =>
			wpcomFetch( {
				api: 'wpcom/v2',
				...( id
					? { path: `memberships/coupon/${ id }`, method: 'PUT' as const }
					: { path: 'memberships/coupons', method: 'POST' as const } ),
				data: payload,
			} ),
		onSettled: () => queryClient.invalidateQueries( { queryKey: COUPONS_KEY } ),
	} );
}
