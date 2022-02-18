/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import { Container, Col } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import ProductDetailCard, { ProductDetail } from '../product-detail-card';
import styles from './style.module.scss';
import useAnalytics from '../../hooks/use-analytics';
import boostImage from './boost.png';
import searchImage from './search.png';
import videoPressImage from './videopress.png';
import crmImage from './crm.png';
import { useProduct } from '../../hooks/use-product';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import getProductCheckoutUrl from '../../utils/get-product-checkout-url';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';

/**
 * Product Interstitial component.
 *
 * @param {object} props                 - Component props.
 * @param {string} props.slug            - Product slug
 * @param {object} props.children        - Product additional content
 * @param {boolean} props.installsPlugin - Whether the interstitial button installs a plugin*
 * @returns {object}                       ProductInterstitial react component.
 */
export default function ProductInterstitial( { installsPlugin = false, slug, children = null } ) {
	const { activate, detail } = useProduct( slug );
	const {
		isUpgradableByBundle,
		pricingForUi: { isFree, wpcomProductSlug },
		hasRequiredPlan,
	} = detail;

	const {
		tracks: { recordEvent },
	} = useAnalytics();

	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_product_interstitial_view', { product: slug } );
	}, [ recordEvent, slug ] );

	const trackProductClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', { product: slug } );
	}, [ recordEvent, slug ] );

	const Product = isUpgradableByBundle ? ProductDetailCard : ProductDetail;
	const { isUserConnected } = useMyJetpackConnection();

	const needsPurchase = ! isFree && ! hasRequiredPlan;

	const addProductUrl =
		needsPurchase && wpcomProductSlug
			? getProductCheckoutUrl( wpcomProductSlug, isUserConnected )
			: null;

	const navigateToMyJetpackOverviewPage = useMyJetpackNavigate( '/' );
	const navigateToCheckoutPage = useCallback( () => {
		window.location.href = addProductUrl;
	}, [ addProductUrl ] );

	const afterInstallation = useCallback(
		free => {
			if ( free || ! addProductUrl ) {
				navigateToMyJetpackOverviewPage();
			} else {
				navigateToCheckoutPage();
			}
		},
		[ navigateToMyJetpackOverviewPage, navigateToCheckoutPage, addProductUrl ]
	);

	const clickHandler = useCallback( () => {
		if ( installsPlugin ) {
			activate()
				.then( () => {
					afterInstallation( isFree );
				} )
				.catch( () => {
					afterInstallation( isFree );
				} );
		}
	}, [ activate, isFree, installsPlugin, afterInstallation ] );
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
				{ children }
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
	return (
		<ProductInterstitial slug="anti-spam" installsPlugin={ true }>
			<ProductDetailCard slug="security" />
		</ProductInterstitial>
	);
}

/**
 * BackupInterstitial component
 *
 * @returns {object} BackupInterstitial react component.
 */
export function BackupInterstitial() {
	return (
		<ProductInterstitial slug="backup" installsPlugin={ true }>
			<ProductDetailCard slug="security" />
		</ProductInterstitial>
	);
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
 * ScanInterstitial component
 *
 * @returns {object} ScanInterstitial react component.
 */
export function ScanInterstitial() {
	return (
		<ProductInterstitial slug="scan" installsPlugin={ true }>
			<ProductDetailCard slug="security" />
		</ProductInterstitial>
	);
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
