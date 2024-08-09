/**
 * External dependencies
 */
import { Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect } from 'react';
/**
 * Internal dependencies
 */
import { MyJetpackRoutes } from '../../constants';
import { PRODUCT_STATUSES } from '../../constants';
import useActivate from '../../data/products/use-activate';
import useInstallStandalonePlugin from '../../data/products/use-install-standalone-plugin';
import useProduct from '../../data/products/use-product';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import ProductCard from '../product-card';
import type { AdditionalAction, SecondaryAction } from '../product-card/types';
import type { FC, ReactNode } from 'react';

interface ConnectedProductCardProps {
	admin: boolean;
	recommendation: boolean;
	slug: JetpackModule;
	children: ReactNode;
	isDataLoading?: boolean;
	Description?: FC;
	additionalActions?: AdditionalAction[];
	secondaryAction?: SecondaryAction;
	upgradeInInterstitial?: boolean;
	primaryActionOverride?: AdditionalAction;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
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
} ) => {
	const { isRegistered, isUserConnected } = useMyJetpackConnection();
	const { recordEvent } = useAnalytics();

	const { install: installStandalonePlugin, isPending: isInstalling } =
		useInstallStandalonePlugin( slug );
	const { activate, isPending: isActivating } = useActivate( slug );
	const { detail, refetch, isLoading: isProductDataLoading } = useProduct( slug );
	const {
		name,
		description: defaultDescription,
		requiresUserConnection,
		status,
		manageUrl,
	} = detail;

	const navigateToConnectionPage = useMyJetpackNavigate( MyJetpackRoutes.Connection );

	/*
	 * Redirect only if connected
	 */
	const handleActivate = useCallback( () => {
		if ( ( ! isRegistered || ! isUserConnected ) && requiresUserConnection ) {
			navigateToConnectionPage();
			return;
		}

		activate( {} );
	}, [
		activate,
		isRegistered,
		isUserConnected,
		requiresUserConnection,
		navigateToConnectionPage,
	] );

	const DefaultDescription = () => {
		// Replace the last space with a non-breaking space to prevent widows
		const cardDescription = defaultDescription.replace( /\s(?=[^\s]*$)/, '\u00A0' );

		return (
			<Text variant="body-small" style={ { flexGrow: 1, marginBottom: '1rem' } }>
				{ cardDescription }
			</Text>
		);
	};

	useEffect( () => {
		if (
			isRegistered &&
			( status === PRODUCT_STATUSES.SITE_CONNECTION_ERROR ||
				status === PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION )
		) {
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
		>
			{ children }
		</ProductCard>
	);
};

export default ConnectedProductCard;
