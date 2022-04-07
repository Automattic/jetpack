/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import { Container, Col, AdminPage, Dialog } from '@automattic/jetpack-components';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';
import ConnectedProductDetail from '../connected-product-detail';
import GoBackLink from '../go-back-link';
import useAnalytics from '../../hooks/use-analytics';
import { useProduct } from '../../hooks/use-product';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import getProductCheckoutUrl from '../../utils/get-product-checkout-url';

// Interstitial images
import boostImage from './boost.png';
import searchImage from './search.png';
import videoPressImage from './videopress.png';
import extrasImage from './extras.png';
import crmImage from './crm.png';

const imagesBySlug = {
	boost: boostImage,
	crm: crmImage,
	extras: extrasImage,
	search: searchImage,
	videopress: videoPressImage,
};

/**
 * Product Interstitial component.
 *
 * @param {object} props                 - Component props.
 * @param {string} props.slug            - Product slug
 * @param {boolean} props.installsPlugin - Whether install product plugin.
 * @returns {object}                       ProductInterstitial react component.
 */
export default function ProductInterstitial( { slug, installsPlugin = true } ) {
	const { activate, detail } = useProduct( slug );
	const { isUpgradableByBundle } = detail;

	// If the product is not upgradable by bundle, take the first one.
	const bundleSlug = isUpgradableByBundle?.length ? isUpgradableByBundle[ 0 ] : null;
	const { recordEvent } = useAnalytics();

	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_product_interstitial_view', { product: slug } );
	}, [ recordEvent, slug ] );

	const trackProductClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', { product: slug } );
	}, [ recordEvent, slug ] );

	const trackBundleClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', { product: bundleSlug } );
	}, [ recordEvent, bundleSlug ] );

	const { isUserConnected } = useMyJetpackConnection();

	const navigateToMyJetpackOverviewPage = useMyJetpackNavigate( '/' );

	const clickHandler = useCallback( () => {
		activate().finally( () => {
			const product = select( STORE_ID ).getProduct( slug );
			const postActivationUrl = product?.postActivationUrl;
			const hasRequiredPlan = product?.hasRequiredPlan;
			const isFree = product?.pricingForUi?.isFree;
			const wpcomProductSlug = product?.pricingForUi?.wpcomProductSlug;
			const needsPurchase = ! isFree && ! hasRequiredPlan;

			if ( postActivationUrl ) {
				window.location.href = postActivationUrl;
				return;
			}

			if ( ! needsPurchase || ! wpcomProductSlug ) {
				return navigateToMyJetpackOverviewPage();
			}

			// Redirect to the checkout page.
			window.location.href = getProductCheckoutUrl( wpcomProductSlug, isUserConnected );
		} );
	}, [ navigateToMyJetpackOverviewPage, activate, isUserConnected, slug ] );

	const onClickGoBack = useCallback( () => {
		if ( slug ) {
			recordEvent( 'jetpack_myjetpack_product_interstitial_back_link_click', { product: slug } );
		}
	}, [ recordEvent, slug ] );

	const Secondary = () =>
		bundleSlug ? (
			<ConnectedProductDetail slug={ bundleSlug } trackButtonClick={ trackBundleClick } />
		) : (
			<img src={ imagesBySlug?.[ slug ] } alt="" />
		);

	return (
		<AdminPage showHeader={ false } showBackground={ false }>
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col>
					<GoBackLink onClick={ onClickGoBack } />
				</Col>
				<Col>
					<Dialog
						primary={
							<ConnectedProductDetail
								slug={ slug }
								trackButtonClick={ trackProductClick }
								onClick={ installsPlugin ? clickHandler : undefined }
								isCard={ !! bundleSlug }
							/>
						}
						secondary={ <Secondary /> }
						split={ !! bundleSlug }
					/>
				</Col>
			</Container>
		</AdminPage>
	);
}
