import { getUserConnectionUrl } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
import { PRODUCT_STATUSES, MyJetpackRoutes } from '../../constants';
import useActivatePlugins from '../../data/products/use-activate-plugins';
import useInstallPlugins from '../../data/products/use-install-plugins';
import useProduct from '../../data/products/use-product';
import useProductsByOwnership from '../../data/products/use-products-by-ownership';
import useAnalytics from '../../hooks/use-analytics';
import useForcedOffReason from '../../hooks/use-forced-off-reason';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import type { SecondaryButtonProps } from './secondary-button';
import type { AdditionalAction } from './types';
import type { MouseEvent } from 'react';

export type ProductStatusActionOptions = {
	primaryActionOverride?: Record< string, AdditionalAction >;
	fixSiteConnectionHandler?: ( e: MouseEvent< HTMLButtonElement > ) => void;
	tracksIdentifier?: `${ string }_${ string }`;
};

/**
 * The action a product's card offers for its status.
 *
 * @param {JetpackModule}              slug      - The product slug.
 * @param {ProductStatusActionOptions} [options] - Label overrides, the site connection handler and the Tracks prefix.
 * @return {{action: Partial<SecondaryButtonProps>, isBusy: boolean, forcedOffReason: string | null}} The action, whether it is busy, and why the host keeps the product off.
 */
const useProductStatusAction = (
	slug: JetpackModule,
	{
		primaryActionOverride,
		fixSiteConnectionHandler,
		tracksIdentifier,
	}: ProductStatusActionOptions = {}
) => {
	const {
		data: { ownedProducts },
	} = useProductsByOwnership();
	const { detail, isLoading: isProductDataLoading, isRefetching } = useProduct( slug );

	const {
		manageUrl,
		purchaseUrl,
		managePaidPlanPurchaseUrl,
		renewPaidPlanPurchaseUrl,
		status,
		requiresUserConnection,
	} = detail;
	const { siteIsRegistering, isRegistered, isUserConnected } = useMyJetpackConnection();
	const isManageDisabled = ! manageUrl;
	const { recordEvent } = useAnalytics();
	const navigateToConnectionPage = useMyJetpackNavigate( MyJetpackRoutes.ConnectionSkipPricing );
	const { activate, isPending: isActivating } = useActivatePlugins( slug );
	const { install: installStandalonePlugin, isPending: isInstalling } = useInstallPlugins( slug );

	const { reason: forcedOffReason, isPending: isForcedOffPending } = useForcedOffReason(
		slug,
		status
	);

	const isBusy =
		isActivating ||
		isForcedOffPending ||
		isProductDataLoading ||
		isRefetching ||
		isInstalling ||
		( siteIsRegistering && status === PRODUCT_STATUSES.SITE_CONNECTION_ERROR );
	const isOwned = ownedProducts?.includes( slug );
	const troubleshootBackupsUrl =
		'https://jetpack.com/support/backup/troubleshooting-jetpack-backup/';

	/*
	 * Redirect only if connected
	 */
	const handleActivate = useCallback( () => {
		if ( ( ! isRegistered || ! isUserConnected ) && requiresUserConnection ) {
			navigateToConnectionPage();
			return;
		}

		recordEvent( `jetpack_myjetpack_${ tracksIdentifier }_activate_click`, {
			product: slug,
		} );

		activate();
	}, [
		activate,
		isRegistered,
		isUserConnected,
		requiresUserConnection,
		navigateToConnectionPage,
		recordEvent,
		slug,
		tracksIdentifier,
	] );

	const learnMoreHandler = useCallback( () => {
		recordEvent( `jetpack_myjetpack_${ tracksIdentifier }_learnmore_click`, {
			product: slug,
		} );
	}, [ slug, recordEvent, tracksIdentifier ] );

	const fixUserConnectionHandler = useCallback( () => {
		recordEvent( `jetpack_myjetpack_${ tracksIdentifier }_fixconnection_click`, {
			product: slug,
		} );
	}, [ slug, recordEvent, tracksIdentifier ] );

	const addHandler = useCallback( () => {
		recordEvent( `jetpack_myjetpack_${ tracksIdentifier }_add_click`, {
			product: slug,
		} );
	}, [ slug, recordEvent, tracksIdentifier ] );

	const manageHandler = useCallback( () => {
		recordEvent( `jetpack_myjetpack_${ tracksIdentifier }_manage_click`, {
			product: slug,
		} );
	}, [ slug, recordEvent, tracksIdentifier ] );

	const installStandaloneHandler = useCallback( () => {
		recordEvent( `jetpack_myjetpack_${ tracksIdentifier }_install_standalone_plugin_click`, {
			product: slug,
		} );
		installStandalonePlugin();
	}, [ slug, installStandalonePlugin, recordEvent, tracksIdentifier ] );

	const action: Partial< SecondaryButtonProps > = useMemo( () => {
		switch ( status ) {
			case PRODUCT_STATUSES.ABSENT: {
				const buttonText = __( 'Learn more', 'jetpack-my-jetpack' );
				return {
					href: `#/add-${ slug }`,
					variant: 'primary',
					label: buttonText,
					onClick: learnMoreHandler,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.ABSENT ] ?? {} ),
				};
			}
			case PRODUCT_STATUSES.ABSENT_WITH_PLAN: {
				const buttonText = __( 'Install Plugin', 'jetpack-my-jetpack' );
				return {
					variant: 'primary',
					label: buttonText,
					onClick: installStandaloneHandler,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.ABSENT_WITH_PLAN ] ?? {} ),
				};
			}
			// The site or user have never been connected before and the connection is required
			case PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION:
				return {
					href: purchaseUrl || `#/add-${ slug }`,
					variant: 'primary',
					label: __( 'Learn more', 'jetpack-my-jetpack' ),
					onClick: addHandler,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION ] ?? {} ),
				};
			case PRODUCT_STATUSES.NEEDS_PLAN: {
				const getPlanText = __( 'Get plan', 'jetpack-my-jetpack' );
				const learnMoreText = __( 'Learn more', 'jetpack-my-jetpack' );
				const buttonText = isOwned ? getPlanText : learnMoreText;

				return {
					href: purchaseUrl || `#/add-${ slug }`,
					variant: 'primary',
					label: buttonText,
					onClick: addHandler,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.NEEDS_PLAN ] ?? {} ),
				};
			}
			case PRODUCT_STATUSES.CAN_UPGRADE: {
				return {
					href: purchaseUrl || `#/add-${ slug }`,
					variant: 'primary',
					label: __( 'Upgrade', 'jetpack-my-jetpack' ),
					onClick: addHandler,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.CAN_UPGRADE ] ?? {} ),
				};
			}
			case PRODUCT_STATUSES.ACTIVE: {
				const buttonText = __( 'View', 'jetpack-my-jetpack' );

				return {
					disabled: isManageDisabled,
					href: manageUrl,
					variant: 'secondary',
					label: buttonText,
					onClick: manageHandler,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.ACTIVE ] ?? {} ),
				};
			}
			case PRODUCT_STATUSES.SITE_CONNECTION_ERROR:
				return {
					variant: 'primary',
					label: __( 'Connect', 'jetpack-my-jetpack' ),
					onClick: fixSiteConnectionHandler,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.SITE_CONNECTION_ERROR ] ?? {} ),
				};
			case PRODUCT_STATUSES.USER_CONNECTION_ERROR:
				return {
					href: getUserConnectionUrl(),
					variant: 'primary',
					label: __( 'Connect', 'jetpack-my-jetpack' ),
					onClick: fixUserConnectionHandler,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.USER_CONNECTION_ERROR ] ?? {} ),
				};
			case PRODUCT_STATUSES.INACTIVE:
			case PRODUCT_STATUSES.MODULE_DISABLED:
			case PRODUCT_STATUSES.NEEDS_ACTIVATION:
				return {
					variant: 'secondary',
					label: __( 'Activate', 'jetpack-my-jetpack' ),
					onClick: handleActivate,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.INACTIVE ] ?? {} ),
				};
			case PRODUCT_STATUSES.EXPIRING_SOON:
				return {
					href: renewPaidPlanPurchaseUrl,
					variant: 'primary',
					label: __( 'Renew my plan', 'jetpack-my-jetpack' ),
					...( primaryActionOverride?.[ PRODUCT_STATUSES.EXPIRING_SOON ] ?? {} ),
				};
			case PRODUCT_STATUSES.EXPIRED:
				return {
					href: managePaidPlanPurchaseUrl,
					variant: 'primary',
					label: __( 'Resume my plan', 'jetpack-my-jetpack' ),
					...( primaryActionOverride?.[ PRODUCT_STATUSES.EXPIRED ] ?? {} ),
				};
			case PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR: {
				const defaultButton: Partial< SecondaryButtonProps > = {
					href: manageUrl,
					variant: 'primary',
					label: __( 'Troubleshoot', 'jetpack-my-jetpack' ),
					...( primaryActionOverride?.[ PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR ] ?? {} ),
				};
				switch ( slug ) {
					case 'backup':
						return {
							...defaultButton,
							href: troubleshootBackupsUrl,
						};
					case 'protect':
						return {
							...defaultButton,
							label: __( 'Fix threats', 'jetpack-my-jetpack' ),
						};
					default:
						return defaultButton;
				}
			}
			case PRODUCT_STATUSES.NEEDS_ATTENTION__WARNING: {
				const defaultButton: Partial< SecondaryButtonProps > = {
					href: manageUrl,
					variant: 'primary',
					label: __( 'Troubleshoot', 'jetpack-my-jetpack' ),
					...( primaryActionOverride?.[ PRODUCT_STATUSES.NEEDS_ATTENTION__WARNING ] ?? {} ),
				};
				switch ( slug ) {
					case 'protect':
						return {
							...defaultButton,
							label: __( 'Fix threats', 'jetpack-my-jetpack' ),
						};
					default:
						return {
							...defaultButton,
						};
				}
			}
			default:
				return {
					href: purchaseUrl || `#/add-${ slug }`,
					label: __( 'Learn more', 'jetpack-my-jetpack' ),
					onClick: addHandler,
				};
		}
	}, [
		status,
		slug,
		purchaseUrl,
		isManageDisabled,
		manageUrl,
		primaryActionOverride,
		isOwned,
		managePaidPlanPurchaseUrl,
		renewPaidPlanPurchaseUrl,
		addHandler,
		fixSiteConnectionHandler,
		fixUserConnectionHandler,
		handleActivate,
		installStandaloneHandler,
		learnMoreHandler,
		manageHandler,
	] );

	return { action, isBusy, forcedOffReason };
};

export default useProductStatusAction;
