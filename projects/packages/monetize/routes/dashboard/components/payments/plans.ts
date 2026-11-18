import { formatCurrency } from '@automattic/number-formatters';
import { __, sprintf } from '@wordpress/i18n';
import type { MembershipProduct } from '../../data/memberships';

export interface Plan {
	product: MembershipProduct;
	/** A tier's annual product, shown and deleted with its monthly one. */
	annual?: MembershipProduct;
}

/**
 * The plans to list, with each tier's annual product folded into its monthly one.
 *
 * @param products - Every product.
 * @return The plans.
 */
export function groupPlans( products: MembershipProduct[] ): Plan[] {
	const ids = new Set( products.map( product => product.id ) );

	return products
		.filter( product => ! product.tier || ! ids.has( product.tier ) )
		.map( product => ( {
			product,
			annual: products.find( other => other.tier === product.id ),
		} ) );
}

/**
 * A product's price with its interval, e.g. `$5.00/month`.
 *
 * @param product - The product.
 * @return The label.
 */
export function priceLabel( product: MembershipProduct ): string {
	const price = formatCurrency( product.price, product.currency );

	switch ( product.interval ) {
		case '1 month':
			/* translators: %s: a price, e.g. $5.00. */
			return sprintf( __( '%s/month', 'jetpack-monetize' ), price );
		case '1 year':
			/* translators: %s: a price, e.g. $50.00. */
			return sprintf( __( '%s/year', 'jetpack-monetize' ), price );
		default:
			return price;
	}
}

/**
 * A plan's price, with a tier's annual price after its monthly one.
 *
 * @param plan - The plan.
 * @return The label.
 */
export function planPriceLabel( plan: Plan ): string {
	const { product, annual } = plan;
	if ( ! annual ) {
		return priceLabel( product );
	}

	return sprintf(
		/* translators: %1$s: the monthly price, e.g. $5.00/month. %2$s: the annual price, e.g. $50.00/year. */
		__( '%1$s (%2$s)', 'jetpack-monetize' ),
		priceLabel( product ),
		priceLabel( annual )
	);
}

/**
 * Whether a plan is a paid newsletter tier, which brings the free tier into the list.
 *
 * @param plan - The plan.
 * @return Whether it's a tier.
 */
export function isTier( plan: Plan ): boolean {
	return plan.product.type === 'tier';
}
