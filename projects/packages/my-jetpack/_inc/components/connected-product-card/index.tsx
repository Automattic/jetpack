/**
 * External dependencies
 */
import { Text } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import PropTypes from 'prop-types';
import { useCallback, useEffect } from 'react';
/**
 * Internal dependencies
 */
import { MyJetpackRoutes } from '../../constants';
import { PRODUCT_STATUSES } from '../../constants';
import useActivate from '../../data/products/use-activate';
import useInstallStandalonePlugin from '../../data/products/use-install-standalone-plugin';
import useProduct from '../../data/products/use-product';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import ProductCard from '../product-card';

const ConnectedProductCard = ( {
	admin,
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
	const { isRegistered, isUserConnected } = useConnection();

	const { install: installStandalonePlugin, isPending: isInstalling } =
		useInstallStandalonePlugin( slug );
	const { activate, isPending: isActivating } = useActivate( slug );
	const { detail, refetch, isLoading: isProductDataLoading } = useProduct( slug );
	const { name, description: defaultDescription, requiresUserConnection, status } = detail;

	const navigateToConnectionPage = useMyJetpackNavigate( MyJetpackRoutes.Connection );

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
		const cardDescription = defaultDescription.replace( /\s(?=[^\s]*$)/, '\u00A0' );

		return (
			<Text variant="body-small" style={ { flexGrow: 1 } }>
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

	return (
		<ProductCard
			name={ name }
			Description={ Description ? Description : DefaultDescription }
			status={ status }
			admin={ admin }
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

ConnectedProductCard.propTypes = {
	children: PropTypes.node,
	admin: PropTypes.bool.isRequired,
	slug: PropTypes.string.isRequired,
	isDataLoading: PropTypes.bool,
	additionalActions: PropTypes.array,
	primaryActionOverride: PropTypes.object,
	secondaryAction: PropTypes.object,
	onMouseEnter: PropTypes.func,
	onMouseLeave: PropTypes.func,
};

export default ConnectedProductCard;
