/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import { Container, Col } from '@automattic/jetpack-components';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ProductDetailCard, { ProductDetail } from '../product-detail-card';
import styles from './style.module.scss';
import useAnalytics from '../../hooks/use-analytics';
import boostImage from './boost.png';
import searchImage from './search.png';
import videoPressImage from './videopress.png';
import extrasImage from './extras.png';
import crmImage from './crm.png';
import { useProduct } from '../../hooks/use-product';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import getProductCheckoutUrl from '../../utils/get-product-checkout-url';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { STORE_ID } from '../../state/store';

/**
 * Product Interstitial component.
 *
 * @param {object} props                 - Component props.
 * @param {string} props.slug            - Product slug
 * @param {string} props.bundle          - Bundle including this product
 * @param {object} props.children        - Product additional content
 * @param {boolean} props.installsPlugin - Whether the interstitial button installs a plugin*
 * @returns {object}                       ProductInterstitial react component.
 */
export default function ProductInterstitial( {
	bundle,
	installsPlugin = false,
	slug,
	children = null,
} ) {
	const { activate, detail } = useProduct( slug );
	const { isUpgradableByBundle } = detail;

	const { recordEvent } = useAnalytics();

	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_product_interstitial_view', { product: slug } );
	}, [ recordEvent, slug ] );

	const trackProductClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', { product: slug } );
	}, [ recordEvent, slug ] );

	const trackBundleClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', { product: bundle } );
	}, [ recordEvent, bundle ] );

	const Product = isUpgradableByBundle ? ProductDetailCard : ProductDetail;
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

	return (
		<Container
			className={ ! isUpgradableByBundle ? styles.container : null }
			horizontalSpacing={ 0 }
			horizontalGap={ 0 }
			fluid
		>
			<Col sm={ 4 } md={ 4 } lg={ 7 }>
				<Product
					slug={ slug }
					trackButtonClick={ trackProductClick }
					onClick={ installsPlugin ? clickHandler : undefined }
				/>
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ 5 } className={ styles.imageContainer }>
				{ bundle ? (
					<ProductDetailCard slug="security" trackButtonClick={ trackBundleClick } />
				) : (
					children
				) }
			</Col>
		</Container>
	);
}

/**
 * AntiSpamInterstitial component
 *
 * @returns {object} AntiSpamInterstitial react component.
 */
export function AntiSpamInterstitial() {
	return <ProductInterstitial slug="anti-spam" installsPlugin={ true } bundle="security" />;
}

/**
 * BackupInterstitial component
 *
 * @returns {object} BackupInterstitial react component.
 */
export function BackupInterstitial() {
	return <ProductInterstitial slug="backup" installsPlugin={ true } bundle="security" />;
}

/**
 * BoostInterstitial component
 *
 * @returns {object} BoostInterstitial react component.
 */
export function BoostInterstitial() {
	return (
		<ProductInterstitial slug="boost" installsPlugin={ true }>
			<img src={ boostImage } alt="Boost" />
		</ProductInterstitial>
	);
}

/**
 * CRMInterstitial component
 *
 * @returns {object} CRMInterstitial react component.
 */
export function CRMInterstitial() {
	return (
		<ProductInterstitial slug="crm" installsPlugin={ true }>
			<img src={ crmImage } alt="CRM" />
		</ProductInterstitial>
	);
}

/**
 * ExtrasInterstitial component
 *
 * @returns {object} ExtrasInterstitial react component.
 */
export function ExtrasInterstitial() {
	return (
		<ProductInterstitial slug="extras" installsPlugin={ true }>
			<img src={ extrasImage } alt="Extras" />
		</ProductInterstitial>
	);
}

/**
 * ScanInterstitial component
 *
 * @returns {object} ScanInterstitial react component.
 */
export function ScanInterstitial() {
	return <ProductInterstitial slug="scan" installsPlugin={ true } bundle="security" />;
}

/**
 * SearchInterstitial component
 *
 * @returns {object} SearchInterstitial react component.
 */
export function SearchInterstitial() {
	return (
		<ProductInterstitial slug="search" installsPlugin={ true }>
			<img src={ searchImage } alt="Search" />
		</ProductInterstitial>
	);
}

/**
 * VideoPressInterstitial component
 *
 * @returns {object} VideoPressInterstitial react component.
 */
export function VideoPressInterstitial() {
	return (
		<ProductInterstitial slug="videopress" installsPlugin={ true }>
			<img src={ videoPressImage } alt="VideoPress" />
		</ProductInterstitial>
	);
}
