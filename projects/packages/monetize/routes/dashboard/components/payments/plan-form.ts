import { __ } from '@wordpress/i18n';
import type { Plan } from './plans';
import type { ProductPayload, StripeStatus } from '../../data/memberships';

export const TIER_DESCRIPTION_MAX = 500;
export const WELCOME_MESSAGE_MAX = 2000;

export interface PlanForm {
	isTier: boolean;
	title: string;
	/** Whether the user typed the name, so changing the type or interval keeps it. */
	titleEdited: boolean;
	description: string;
	interval: string;
	currency: string;
	price: number;
	/** A tier's yearly price. */
	annualPrice: number;
	welcomeMessage: string;
	payWhatYouWant: boolean;
	multiplePerUser: boolean;
	addToNewsletter: boolean;
}

export type PlanFormError = 'title' | 'price' | 'annualPrice' | 'description' | 'welcomeMessage';

type Currencies = Pick< StripeStatus, 'defaultCurrency' | 'minimumAmounts' >;

/**
 * The smallest price Stripe takes in a currency, doubled when it isn't the account's own to cover conversion.
 *
 * @param currencies - The Stripe account's currencies.
 * @param currency   - The plan's currency.
 * @return The minimum, or 0 when Stripe names none.
 */
export function minimumPrice( currencies: Currencies, currency: string ): number {
	const minimum = currencies.minimumAmounts[ currency ] ?? 0;
	return currency === currencies.defaultCurrency ? minimum : minimum * 2;
}

/**
 * The currency a new plan or coupon starts in: the account's own when Stripe supports it, else USD.
 *
 * @param currencies - The Stripe account's currencies.
 * @return The currency.
 */
export function defaultCurrency( currencies: Currencies ): string {
	return currencies.defaultCurrency in currencies.minimumAmounts
		? currencies.defaultCurrency
		: 'USD';
}

/**
 * The name a new plan starts with.
 *
 * @param isTier   - Whether it's a newsletter tier.
 * @param interval - How often it renews.
 * @return The name.
 */
export function defaultTitle( isTier: boolean, interval: string ): string {
	if ( isTier ) {
		return __( 'Newsletter Tier', 'jetpack-monetize' );
	}
	switch ( interval ) {
		case '1 month':
			return __( 'Monthly Subscription', 'jetpack-monetize' );
		case '1 year':
			return __( 'Yearly Subscription', 'jetpack-monetize' );
		default:
			return __( 'One time purchase', 'jetpack-monetize' );
	}
}

/**
 * The form for a plan, or for a new one priced at Stripe's minimum.
 *
 * @param plan       - The plan to edit, if any.
 * @param currencies - The Stripe account's currencies.
 * @param isTier     - Whether a new plan starts as a newsletter tier.
 * @return The form.
 */
export function initialForm( plan: Plan | null, currencies: Currencies, isTier = false ): PlanForm {
	if ( plan ) {
		const { product, annual } = plan;
		return {
			isTier: product.type === 'tier',
			title: product.title,
			titleEdited: true,
			description: product.description,
			interval: product.interval,
			currency: product.currency,
			price: product.price,
			annualPrice: annual?.price ?? product.price * 12,
			welcomeMessage: product.welcomeEmailContent,
			payWhatYouWant: product.buyerCanChangeAmount,
			multiplePerUser: product.multiplePerUser,
			addToNewsletter: product.subscribeAsSiteSubscriber,
		};
	}

	const currency = defaultCurrency( currencies );
	const price = minimumPrice( currencies, currency );
	return {
		isTier,
		title: defaultTitle( isTier, '1 month' ),
		titleEdited: false,
		description: '',
		interval: '1 month',
		currency,
		price,
		annualPrice: price * 12,
		welcomeMessage: '',
		payWhatYouWant: false,
		multiplePerUser: false,
		addToNewsletter: isTier,
	};
}

/**
 * What's wrong with the form, as Calypso checks it.
 *
 * @param form       - The form.
 * @param currencies - The Stripe account's currencies.
 * @return The fields in error.
 */
export function validate( form: PlanForm, currencies: Currencies ): PlanFormError[] {
	const minimum = minimumPrice( currencies, form.currency );
	const errors: PlanFormError[] = [];

	if ( ! form.title.trim() ) {
		errors.push( 'title' );
	}
	if ( form.price < minimum ) {
		errors.push( 'price' );
	}
	if ( form.isTier && ( form.annualPrice < minimum || form.annualPrice <= form.price ) ) {
		errors.push( 'annualPrice' );
	}
	if ( form.isTier && form.description.trim().length > TIER_DESCRIPTION_MAX ) {
		errors.push( 'description' );
	}
	if ( form.welcomeMessage.length > WELCOME_MESSAGE_MAX ) {
		errors.push( 'welcomeMessage' );
	}
	return errors;
}

/**
 * The monthly (or only) product's fields; a tier's annual product copies them.
 *
 * @param form - The form.
 * @return The payload.
 */
export function toPayload( form: PlanForm ): ProductPayload {
	return {
		title: form.title.trim(),
		price: form.price,
		currency: form.currency,
		interval: form.isTier ? '1 month' : form.interval,
		welcome_email_content: form.welcomeMessage,
		buyer_can_change_amount: form.payWhatYouWant,
		multiple_per_user: form.multiplePerUser,
		subscribe_as_site_subscriber: form.isTier || form.addToNewsletter,
		is_editable: true,
		...( form.isTier ? { type: 'tier' as const, description: form.description.trim() } : {} ),
	};
}
