import { PRODUCTS_MUST_HAVE_A_STANDALONE_PLUGIN, PRODUCT_STATUSES } from '../../../constants';
import type { ProductCamelCase } from '../../../data/types';

export type FeatureActionKind = 'learn_more' | 'install' | 'activate' | 'running';

const INSTALLABLE: string[] = [ PRODUCT_STATUSES.ABSENT, PRODUCT_STATUSES.ABSENT_WITH_PLAN ];
const ACTIVATABLE: string[] = [
	PRODUCT_STATUSES.INACTIVE,
	PRODUCT_STATUSES.MODULE_DISABLED,
	PRODUCT_STATUSES.NEEDS_ACTIVATION,
];

/**
 * Decide what a product-backed feature offers to do next.
 *
 * The badge and the action button both read this, so they cannot contradict each other.
 *
 * @param product           - Live product record from the products store.
 * @param hasLearnMoreRoute - Whether the feature has an interstitial to send someone to.
 * @return The action the row should offer.
 */
export function resolveFeatureAction(
	product: ProductCamelCase,
	hasLearnMoreRoute: boolean
): FeatureActionKind {
	// A plan is not something the list can install its way out of.
	if ( product.status === PRODUCT_STATUSES.NEEDS_PLAN && hasLearnMoreRoute ) {
		return 'learn_more';
	}

	if ( INSTALLABLE.includes( product.status ) ) {
		return 'install';
	}

	const needsStandalone = PRODUCTS_MUST_HAVE_A_STANDALONE_PLUGIN.includes( product.slug );
	const standalone = product.standalonePluginInfo;

	if ( needsStandalone && ! standalone?.isStandaloneInstalled ) {
		return 'install';
	}

	if ( ACTIVATABLE.includes( product.status ) ) {
		return 'activate';
	}

	if ( needsStandalone && ! standalone?.isStandaloneActive ) {
		return 'activate';
	}

	return 'running';
}
