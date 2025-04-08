import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { PRODUCT_STATUSES } from '../../constants';
import useActivatePlugins from '../../data/products/use-activate-plugins';
import useInstallPlugins from '../../data/products/use-install-plugins';
import useProduct from '../../data/products/use-product';
import { ProductCamelCase } from '../../data/types';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';

const parsePricingData = ( pricingForUi: ProductCamelCase[ 'pricingForUi' ] ) => {
	const { tiers, wpcomFreeProductSlug, introductoryOffer } = pricingForUi || {};
	if ( tiers ) {
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
			fullPrice: fullPrice ? fullPrice / 12 : 0,
			currencyCode: currencyCode ?? 'USD',
		};
	}

	const {
		discountPrice,
		discountPricePerMonth,
		fullPrice,
		fullPricePerMonth,
		currencyCode,
		wpcomProductSlug,
	} = pricingForUi || {};
	const hasDiscount = discountPrice && discountPrice !== fullPrice;
	const eligibleForIntroDiscount = ! introductoryOffer?.reason;
	return {
		wpcomFreeProductSlug,
		wpcomProductSlug,
		discountPrice:
			// Only display discount if site is elgible
			hasDiscount && eligibleForIntroDiscount ? discountPricePerMonth : null,
		fullPrice: fullPricePerMonth ?? 0,
		currencyCode: currencyCode ?? 'USD',
	};
};

// type for onCheckout and onActivate
type Actions = {
	onCheckout: () => void;
	onActivate: () => void;
	onInstall: () => void;
	onManage: () => void;
};

const getFeaturePrimaryAction = (
	detail: ProductCamelCase,
	{ onActivate, onInstall, onManage }: Omit< Actions, 'onCheckout' >
) => {
	switch ( detail.status ) {
		case PRODUCT_STATUSES.MODULE_DISABLED:
			return { label: __( 'Activate', 'jetpack-my-jetpack' ), onClick: onActivate };
		case PRODUCT_STATUSES.ABSENT:
			return { label: __( 'Install', 'jetpack-my-jetpack' ), onClick: onInstall };
		case PRODUCT_STATUSES.USER_CONNECTION_ERROR:
			return { label: __( 'Connect', 'jetpack-my-jetpack' ), href: '#/connection' };
		default:
			return {
				label: __( 'Manage', 'jetpack-my-jetpack' ),
				href: detail.manageUrl,
				onClick: onManage,
			};
	}
};

const getPrimaryAction = (
	detail: ProductCamelCase,
	{ onCheckout, onActivate, onInstall, onManage }: Actions
) => {
	const isUpgradable =
		detail.status === PRODUCT_STATUSES.ACTIVE &&
		( detail.isUpgradableByBundle.length || detail.isUpgradable );
	const upgradeHasPrice =
		detail?.pricingForUi?.fullPrice || detail?.pricingForUi?.tiers?.upgraded?.fullPrice;

	if ( detail.status === PRODUCT_STATUSES.CAN_UPGRADE || isUpgradable ) {
		if ( upgradeHasPrice ) {
			return { label: __( 'Upgrade', 'jetpack-my-jetpack' ), onClick: onCheckout };
		}
		return null;
	}

	if ( detail.isFeature ) {
		return getFeaturePrimaryAction( detail, { onActivate, onInstall, onManage } );
	}

	return { label: __( 'Purchase', 'jetpack-my-jetpack' ), onClick: onCheckout };
};

const getSecondaryAction = ( detail: ProductCamelCase, onActivate: () => void ) => {
	if ( detail.isFeature ) {
		return null;
	}

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
	const { install: installPlugin, isPending: isInstalling } = useInstallPlugins( slug );

	const { isUserConnected } = useMyJetpackConnection();
	const { myJetpackUrl, siteSuffix } = getMyJetpackWindowInitialState();
	const { activate, isPending: isActivating } = useActivatePlugins( slug );
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

	const handleInstall = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_evaluation_recommendations_install_plugin_click', {
			product: slug,
		} );
		installPlugin();
	}, [ slug, installPlugin, recordEvent ] );

	const handleManage = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_evaluation_recommendations_manage_click', {
			product: slug,
		} );
	}, [ slug, recordEvent ] );

	return {
		secondaryAction: getSecondaryAction( detail, handleActivate ),
		primaryAction: getPrimaryAction( detail, {
			onCheckout: handleCheckout,
			onActivate: handleActivate,
			onInstall: handleInstall,
			onManage: handleManage,
		} ),
		isFeature: detail.isFeature,
		hasFreeOffering: detail.hasFreeOffering,
		isActivating,
		isInstalling,
		...data,
	};
};

export default usePricingData;
