/**
 * External dependencies
 */
import { Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect } from 'react';
/**
 * Internal dependencies
 */
import { MyJetpackRoutes, PRODUCT_STATUSES } from '../../constants';
import useActivatePlugins from '../../data/products/use-activate-plugins';
import useInstallPlugins from '../../data/products/use-install-plugins';
import useProduct from '../../data/products/use-product';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import preventWidows from '../../utils/prevent-widows';
import ProductCard from '../product-card';
import type { AdditionalAction, SecondaryAction } from '../product-card/types';
import type { FC, ReactNode } from 'react';

interface ConnectedProductCardProps {
	admin: boolean;
	recommendation?: boolean;
	showMenu?: boolean;
	slug: JetpackModule;
	children?: ReactNode;
	isDataLoading?: boolean;
	Description?: FC;
	additionalActions?: AdditionalAction[];
	secondaryAction?: SecondaryAction;
	upgradeInInterstitial?: boolean;
	primaryActionOverride?: Record< string, AdditionalAction >;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	customLoadTracks?: Record< Lowercase< string >, unknown >;
}

const ConnectedProductCard: FC< ConnectedProductCardProps > = ( {
	admin,
	recommendation,
	slug,
	children,
	isDataLoading,
	Description = null,
	additionalActions = null,
	secondaryAction = null,
	upgradeInInterstitial = false,
	primaryActionOverride,
	onMouseEnter,
	onMouseLeave,
	customLoadTracks,
} ) => {
	const { isRegistered, isUserConnected } = useMyJetpackConnection();
	const { recordEvent } = useAnalytics();

	const { install: installStandalonePlugin, isPending: isInstalling } = useInstallPlugins( slug );
	const { activate, isPending: isActivating } = useActivatePlugins( slug );
	const { detail, refetch, isLoading: isProductDataLoading } = useProduct( slug );
	const {
		name,
		description: defaultDescription,
		requiresUserConnection,
		status,
		manageUrl,
	} = detail;

	const navigateToConnectionPage = useMyJetpackNavigate( MyJetpackRoutes.ConnectionSkipPricing );

	/*
	 * Redirect only if connected
	 */
	const handleActivate = useCallback( () => {
		if ( ( ! isRegistered || ! isUserConnected ) && requiresUserConnection ) {
			navigateToConnectionPage();
			return;
		}

		activate();
	}, [
		activate,
		isRegistered,
		isUserConnected,
		requiresUserConnection,
		navigateToConnectionPage,
	] );

	const DefaultDescription = () => {
		// Replace the last space with a non-breaking space to prevent widows
		const cardDescription = preventWidows( defaultDescription );

		return (
			<Text variant="body-small" style={ { flexGrow: 1, marginBottom: '1rem' } }>
				{ cardDescription }
			</Text>
		);
	};

	useEffect( () => {
		if ( isRegistered ) {
			refetch();
		}
	}, [ isRegistered, status, refetch ] );

	/**
	 * Calls the passed function onManage after firing Tracks event
	 */
	const manageHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_manage_click', {
			product: slug,
		} );
	}, [ slug, recordEvent ] );

	if ( ! secondaryAction && status === PRODUCT_STATUSES.CAN_UPGRADE ) {
		secondaryAction = {
			href: manageUrl,
			label: __( 'View', 'jetpack-my-jetpack' ),
			onClick: manageHandler,
		};
	}

	return (
		<ProductCard
			name={ name }
			Description={ Description ? Description : DefaultDescription }
			status={ status }
			admin={ admin }
			recommendation={ recommendation }
			isFetching={ isActivating || isInstalling || isProductDataLoading }
			isDataLoading={ isDataLoading }
			isInstallingStandalone={ isInstalling }
			additionalActions={ additionalActions }
			primaryActionOverride={ primaryActionOverride }
			secondaryAction={ secondaryAction }
			slug={ slug }
			onActivate={ handleActivate }
			onInstallStandalone={ installStandalonePlugin }
			upgradeInInterstitial={ upgradeInInterstitial }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
			customLoadTracks={ customLoadTracks }
		>
			{ children }
		</ProductCard>
	);
};

export default ConnectedProductCard;
