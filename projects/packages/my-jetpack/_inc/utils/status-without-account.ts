import { PRODUCT_STATUSES } from '../constants';
import { PRODUCT_SLUGS } from '../data/constants';
import type { ProductCamelCase } from '../data/types';

// Their modules run without an account, so the Overview shows them on or off, as Features does.
const ACCOUNT_OPTIONAL_PRODUCTS: string[] = [ PRODUCT_SLUGS.SEARCH, PRODUCT_SLUGS.VIDEOPRESS ];

/**
 * Whether the Overview shows the product's state, not Connect, on a site with no account.
 *
 * @param slug - The product slug.
 * @return Whether the product's module runs without an account.
 */
export const isAccountOptional = ( slug: string ): boolean =>
	ACCOUNT_OPTIONAL_PRODUCTS.includes( slug );

/**
 * The product's status, with a missing account read as on or off for products that don't need one.
 *
 * @param slug   - The product slug.
 * @param detail - The product, undefined while it loads.
 * @return The status.
 */
export const getStatusWithoutAccount = (
	slug: string,
	detail?: Pick< ProductCamelCase, 'status' | 'isActivated' >
): ProductStatus | undefined => {
	if ( detail?.status !== PRODUCT_STATUSES.USER_CONNECTION_ERROR || ! isAccountOptional( slug ) ) {
		return detail?.status;
	}

	return (
		detail.isActivated ? PRODUCT_STATUSES.ACTIVE : PRODUCT_STATUSES.MODULE_DISABLED
	) as ProductStatus;
};
