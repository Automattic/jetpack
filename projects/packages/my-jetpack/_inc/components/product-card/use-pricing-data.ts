import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { PRODUCT_STATUSES } from '../../constants';
import useActivate from '../../data/products/use-activate';
import useProduct from '../../data/products/use-product';
import { ProductCamelCase } from '../../data/types';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';

const parsePricingData = ( pricingForUi: ProductCamelCase[ 'pricingForUi' ] ) => {
	const { tiers, wpcomFreeProductSlug, introductoryOffer } = pricingForUi;

	if ( pricingForUi.tiers ) {
		const {
			discountPrice,
			fullPrice,
			currencyCode,
			wpcomProductSlug,
			quantity,
			introductoryOffer: tierIntroOffer,
		} = tiers.upgraded;
		const hasDiscount = discountPrice && discountPrice !== fullPrice;
		const eligibleForIntroDiscount = ! tierIntroOffer?.reason;
		return {
			wpcomFreeProductSlug,
			wpcomProductSlug: ! quantity ? wpcomProductSlug : `${ wpcomProductSlug }:-q-${ quantity }`,
			discountPrice: hasDiscount && eligibleForIntroDiscount ? discountPrice / 12 : null,
			fullPrice: fullPrice / 12,
			currencyCode,
		};
	}

	const {
		discountPricePerMonth,
		fullPricePerMonth,
		currencyCode,
		isIntroductoryOffer,
		wpcomProductSlug,
	} = pricingForUi;
	return {
		wpcomFreeProductSlug,
		wpcomProductSlug,
		discountPrice:
			// Only display discount if site is elgible
			isIntroductoryOffer && ! introductoryOffer?.reason ? discountPricePerMonth : null,
		fullPrice: fullPricePerMonth,
		currencyCode,
	};
};

const getPurchaseAction = ( detail: ProductCamelCase, onCheckout: () => void ) => {
	const isUpgradable =
		detail.status === PRODUCT_STATUSES.ACTIVE &&
		( detail.isUpgradableByBundle.length || detail.isUpgradable );
	const upgradeHasPrice =
		detail.pricingForUi.fullPrice || detail.pricingForUi.tiers?.upgraded?.fullPrice;

	if ( detail.status === PRODUCT_STATUSES.CAN_UPGRADE || isUpgradable ) {
		if ( upgradeHasPrice ) {
			return { label: __( 'Upgrade', 'jetpack-my-jetpack' ), onClick: onCheckout };
		}
		return null;
	}

	return { label: __( 'Purchase', 'jetpack-my-jetpack' ), onClick: onCheckout };
};

const getSecondaryAction = ( detail: ProductCamelCase, onActivate: () => void ) => {
	const START_FOR_FREE_FEATURE_FLAG = false;
	const isNotActiveOrNeedsExplicitFreePlan =
		! detail.isPluginActive ||
		detail.status === PRODUCT_STATUSES.NEEDS_ACTIVATION ||
		detail.status === PRODUCT_STATUSES.NEEDS_PLAN;

	if (
		START_FOR_FREE_FEATURE_FLAG &&
		isNotActiveOrNeedsExplicitFreePlan &&
		( detail.tiers.includes( 'free' ) ||
			detail.hasFreeOffering ||
			detail.pricingForUi.wpcomFreeProductSlug )
	) {
		return {
			label: __( 'Start for free', 'jetpack-my-jetpack' ),
			onClick: onActivate,
		};
	}

	return { label: __( 'Learn more', 'jetpack-my-jetpack' ), href: `#/add-${ detail.slug }` };
};

const usePricingData = ( slug: string ) => {
	const { recordEvent } = useAnalytics();
	const { detail } = useProduct( slug );
	const { wpcomProductSlug, wpcomFreeProductSlug, ...data } = parsePricingData(
		detail.pricingForUi
	);

	const { isUserConnected } = useMyJetpackConnection();
	const { myJetpackUrl, siteSuffix } = getMyJetpackWindowInitialState();
	const { activate, isPending: isActivating } = useActivate( slug );
	const { run: runCheckout } = useProductCheckoutWorkflow( {
		from: 'my-jetpack',
		productSlug: wpcomProductSlug,
		redirectUrl: myJetpackUrl,
		connectAfterCheckout: ! isUserConnected,
		siteSuffix,
	} );
	const { run: runFreeCheckout } = useProductCheckoutWorkflow( {
		from: 'my-jetpack',
		productSlug: wpcomFreeProductSlug,
		redirectUrl: myJetpackUrl,
		connectAfterCheckout: ! isUserConnected,
		siteSuffix,
	} );

	const handleActivate = useCallback( () => {
		if ( wpcomFreeProductSlug ) {
			runFreeCheckout();
		} else {
			activate();
		}
	}, [ activate, runFreeCheckout, wpcomFreeProductSlug ] );

	const handleCheckout = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_evaluation_recommendations_checkout_click', { slug } );
		if ( slug === 'crm' ) {
			activate();
			window.open( 'https://jetpackcrm.com/pricing/', '_blank' );
			return;
		}
		runCheckout();
	}, [ activate, recordEvent, runCheckout, slug ] );

	return {
		secondaryAction: getSecondaryAction( detail, handleActivate ),
		purchaseAction: getPurchaseAction( detail, handleCheckout ),
		isActivating,
		...data,
	};
};

export default usePricingData;
