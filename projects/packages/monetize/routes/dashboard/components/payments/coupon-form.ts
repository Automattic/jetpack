import { defaultCurrency } from './plan-form';
import type { Coupon, CouponPayload } from '../../data/coupons';
import type { StripeStatus } from '../../data/memberships';

const CODE_PATTERN = /^[a-zA-Z0-9-]{3,20}$/;

/** `<n> months` values Calypso offers, forever first. */
export const DURATIONS = [ '', '1 months', '3 months', '6 months', '12 months' ];

const RANDOM_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const RANDOM_CODE_LENGTH = 8;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Calypso's pattern: `*` stands in for any part of the address.
const EMAIL_PATTERN = /^[\w.\-+*]+@(?:(?:[\w\-*]+(?:\.[\w\-*]+)+)+|(?:[\w\-*]*\*[\w\-*]*)+)+$/;

export interface CouponForm {
	code: string;
	discountType: 'percentage' | 'amount';
	/** The percentage or amount as typed. */
	discount: string;
	currency: string;
	startDate: string;
	endDate: string;
	duration: string;
	/** As typed; blank for no limit. */
	limitPerUser: string;
	canBeCombined: boolean;
	firstTimeOnly: boolean;
	planIds: number[];
	/** Comma-separated, as typed. */
	emails: string;
}

export type CouponFormError =
	'code' | 'discount' | 'startDate' | 'endDate' | 'limitPerUser' | 'emails';

/**
 * Today in the browser's timezone, as `Y-m-d`.
 *
 * @return The date.
 */
export function today(): string {
	const now = new Date();
	return [ now.getFullYear(), now.getMonth() + 1, now.getDate() ]
		.map( part => String( part ).padStart( 2, '0' ) )
		.join( '-' );
}

/**
 * A code made of characters that can't be mistaken for each other, unlike any of the given ones.
 *
 * @param existing - Codes already in use.
 * @return The code.
 */
export function randomCode( existing: string[] ): string {
	const taken = new Set( existing.map( code => code.toUpperCase() ) );
	let code;
	do {
		code = Array.from( { length: RANDOM_CODE_LENGTH }, () =>
			RANDOM_CODE_CHARSET.charAt( Math.floor( Math.random() * RANDOM_CODE_CHARSET.length ) )
		).join( '' );
	} while ( taken.has( code ) );
	return code;
}

/**
 * The form for a coupon, or a blank one starting today.
 *
 * @param coupon     - The coupon to edit, if any.
 * @param currencies - The Stripe account's currencies.
 * @return The form.
 */
export function initialForm(
	coupon: Coupon | null,
	currencies: Pick< StripeStatus, 'defaultCurrency' | 'minimumAmounts' >
): CouponForm {
	if ( coupon ) {
		return {
			code: coupon.code,
			discountType: coupon.discountType,
			discount: String( coupon.discount ),
			currency: coupon.currency,
			startDate: coupon.startDate,
			endDate: coupon.endDate,
			duration: coupon.months ? `${ coupon.months } months` : '',
			limitPerUser: coupon.limitPerUser ? String( coupon.limitPerUser ) : '',
			canBeCombined: coupon.canBeCombined,
			firstTimeOnly: coupon.firstTimeOnly,
			planIds: coupon.planIds,
			emails: coupon.emails.join( ', ' ),
		};
	}

	return {
		code: '',
		discountType: 'percentage',
		discount: '',
		currency: defaultCurrency( currencies ),
		startDate: today(),
		endDate: '',
		duration: '',
		limitPerUser: '',
		canBeCombined: true,
		firstTimeOnly: false,
		planIds: [],
		emails: '',
	};
}

/**
 * The typed emails, trimmed, without blanks.
 *
 * @param emails - Comma-separated emails.
 * @return The emails.
 */
export function parseEmails( emails: string ): string[] {
	return emails
		.split( ',' )
		.map( email => email.trim() )
		.filter( Boolean );
}

/**
 * The typed emails that aren't addresses or patterns.
 *
 * @param emails - Comma-separated emails.
 * @return The invalid ones.
 */
export function invalidEmails( emails: string ): string[] {
	return parseEmails( emails ).filter( email => ! EMAIL_PATTERN.test( email ) );
}

/**
 * What's wrong with the form, as WordPress.com would reject it.
 *
 * @param form      - The form.
 * @param isEditing - Whether it's an existing coupon, which may already have expired.
 * @return The fields in error.
 */
export function validate( form: CouponForm, isEditing: boolean ): CouponFormError[] {
	const errors: CouponFormError[] = [];
	// WordPress.com keeps only the whole part of a discount.
	const discount = Number( form.discount );
	const maxDiscount = form.discountType === 'percentage' ? 100 : Infinity;
	const limit = Number( form.limitPerUser );

	if ( ! CODE_PATTERN.test( form.code ) ) {
		errors.push( 'code' );
	}
	if ( ! Number.isInteger( discount ) || discount < 1 || discount > maxDiscount ) {
		errors.push( 'discount' );
	}
	if ( ! DATE_PATTERN.test( form.startDate ) ) {
		errors.push( 'startDate' );
	}
	if (
		form.endDate &&
		( ! DATE_PATTERN.test( form.endDate ) ||
			form.endDate < form.startDate ||
			( ! isEditing && form.endDate < today() ) )
	) {
		errors.push( 'endDate' );
	}
	if ( form.limitPerUser && ( ! Number.isInteger( limit ) || limit < 1 ) ) {
		errors.push( 'limitPerUser' );
	}
	if ( invalidEmails( form.emails ).length ) {
		errors.push( 'emails' );
	}
	return errors;
}

/**
 * The coupon as WordPress.com saves it.
 *
 * @param form - A valid form.
 * @return The payload.
 */
export function toPayload( form: CouponForm ): CouponPayload {
	const discount = Number( form.discount );
	return {
		coupon_code: form.code,
		discount_type: form.discountType,
		...( form.discountType === 'percentage'
			? { discount_percentage: discount }
			: { discount_value: discount, discount_currency: form.currency } ),
		start_date: form.startDate,
		end_date: form.endDate,
		duration: form.duration,
		...( form.limitPerUser ? { limit_per_user: Number( form.limitPerUser ) } : {} ),
		can_be_combined: form.canBeCombined,
		first_time_purchase_only: form.firstTimeOnly,
		plan_ids_allow_list: form.planIds,
		email_allow_list: parseEmails( form.emails ),
	};
}
