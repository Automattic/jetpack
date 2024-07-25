import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { PRODUCT_STATUSES } from '../../constants';
import useActivate from '../../data/products/use-activate';
import useProduct from '../../data/products/use-product';
import { ProductCamelCase } from '../../data/types';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';

const parsePricingData = ( pricingForUi: ProductCamelCase[ 'pricingForUi' ] ) => {
	const { tiers } = pricingForUi;

	if ( pricingForUi.tiers ) {
		const { discountPrice, fullPrice, currencyCode, wpcomProductSlug, quantity } = tiers.upgraded;
		const hasDiscount = discountPrice && discountPrice !== fullPrice;
		return {
			wpcomProductSlug: ! quantity ? wpcomProductSlug : `${ wpcomProductSlug }:-q-${ quantity }`,
			discountPrice: hasDiscount ? discountPrice / 12 : null,
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
		wpcomProductSlug,
		discountPrice: isIntroductoryOffer ? discountPricePerMonth : null,
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
	const isNotActiveOrNeedsExplicitFreePlan =
		! detail.isPluginActive || detail.status === PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE;

	if (
		isNotActiveOrNeedsExplicitFreePlan &&
		( detail.tiers.includes( 'free' ) || detail.hasFreeOffering )
	) {
		return {
			label: __( 'Start for free', 'jetpack-my-jetpack' ),
			onClick: onActivate,
		};
	}

	return { label: __( 'Learn more', 'jetpack-my-jetpack' ), href: `#/add-${ detail.slug }` };
};

const usePricingData = ( slug: string ) => {
	const { detail } = useProduct( slug );
	const { wpcomProductSlug, ...data } = parsePricingData( detail.pricingForUi );

	const { isUserConnected } = useMyJetpackConnection();
	const { myJetpackUrl, siteSuffix } = getMyJetpackWindowInitialState();
	const { activate, isPending: isActivating } = useActivate( slug );
	const { run: runCheckout, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		from: 'my-jetpack',
		productSlug: wpcomProductSlug,
		redirectUrl: myJetpackUrl,
		connectAfterCheckout: ! isUserConnected,
		siteSuffix,
	} );

	const handleActivate = useCallback( () => {
		activate( {} );
	}, [ activate ] );

	const handleCheckout = useCallback( () => {
		if ( slug === 'crm' ) {
			activate( {} );
			window.open( 'https://jetpackcrm.com/pricing/', '_blank' );
			return;
		}
		runCheckout();
	}, [ activate, runCheckout, slug ] );

	return {
		secondaryAction: getSecondaryAction( detail, handleActivate ),
		purchaseAction: getPurchaseAction( detail, handleCheckout ),
		isActivating,
		hasCheckoutStarted,
		...data,
	};
};

export default usePricingData;
