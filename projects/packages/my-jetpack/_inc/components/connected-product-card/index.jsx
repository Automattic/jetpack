/**
 * External dependencies
 */
import { Text } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import PropTypes from 'prop-types';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { MyJetpackRoutes } from '../../constants';
import useActivate from '../../data/products/use-activate';
import useInstallStandalonePlugin from '../../data/products/use-install-standalone-plugin';
import useProduct from '../../data/products/use-product';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import ProductCard from '../product-card';

const ConnectedProductCard = ( {
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
	const { isRegistered, isUserConnected } = useConnection();

	const { install: installStandalonePlugin, isPending: isInstalling } =
		useInstallStandalonePlugin( slug );
	const { activate, isPending: isActivating } = useActivate( slug );
	const { detail } = useProduct( slug );
	const {
		name,
		description: defaultDescription,
		longDescription,
		requiresUserConnection,
		status,
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

		activate();
	}, [
		activate,
		isRegistered,
		isUserConnected,
		requiresUserConnection,
		navigateToConnectionPage,
	] );

	const DefaultDescription = () => {
		const productDescription = ! recommendation ? defaultDescription : longDescription;
		// Replace the last space with a non-breaking space to prevent widows
		const cardDescription = productDescription.replace( /\s(?=[^\s]*$)/, '\u00A0' );

		return (
			<Text variant="body-small" style={ { flexGrow: 1 } }>
				{ cardDescription }
			</Text>
		);
	};

	return (
		<ProductCard
			name={ name }
			Description={ Description ? Description : DefaultDescription }
			status={ status }
			admin={ admin }
			recommendation={ recommendation }
			isFetching={ isActivating || isInstalling }
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
	recommendation: PropTypes.bool,
	slug: PropTypes.string.isRequired,
	isDataLoading: PropTypes.bool,
	additionalActions: PropTypes.array,
	primaryActionOverride: PropTypes.object,
	secondaryAction: PropTypes.object,
	onMouseEnter: PropTypes.func,
	onMouseLeave: PropTypes.func,
};

export default ConnectedProductCard;
