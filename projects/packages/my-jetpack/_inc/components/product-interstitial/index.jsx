/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Container, Col, AdminPage } from '@automattic/jetpack-components';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import useAnalytics from '../../hooks/use-analytics';
import { useProduct } from '../../hooks/use-product';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import getProductCheckoutUrl from '../../utils/get-product-checkout-url';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { STORE_ID } from '../../state/store';
import GoBackLink from '../go-back-link';
import ConnectedProductOffer from '../connected-product-offer';

import boostImage from './boost.png';
import searchImage from './search.png';
import videoPressImage from './videopress.png';
import extrasImage from './extras.png';
import crmImage from './crm.png';

const PRODUCT_IMAGES = {
	boost: boostImage,
	search: searchImage,
	videopress: videoPressImage,
	extras: extrasImage,
	crm: crmImage,
};

/**
 * Returns the product image for the given product slug.
 *
 * @param {string} productSlug - The product slug.
 * @returns {HTMLElement} The product image.
 */
function getImageByProductSlug( productSlug ) {
	return PRODUCT_IMAGES[ productSlug ] || null;
}

/**
 * Product Interstitial component.
 *
 * @param {object} props                 - Component props.
 * @param {string} props.slug            - Product slug
 * @param {object} props.children        - Product additional content
 * @param {boolean} props.installsPlugin - Whether the interstitial button installs a plugin*
 * @returns {object}                       ProductInterstitial react component.
 */
export default function ProductInterstitial( { installsPlugin, slug, children } ) {
	const { activate, detail } = useProduct( slug );
	const { name, isUpgradableByBundle } = detail;

	/*
	 * isUpgradableByBundle is an array that provides
	 * the bundles that can get this product when upgrading.
	 * For now, `security` is the onle product bundle
	 * so let's pick the first when it's defined.
	 */
	const bundle = isUpgradableByBundle?.length > 0 ? isUpgradableByBundle[ 0 ] : null;

	/*
	 * Children prop (optional) is rendered in
	 * the secondary section of the product interstitial page.
	 * When it is not defined, it renders the product image,
	 * as long as it is not upgradable by a bundle.
	 */
	const secondarySection = ! isUpgradableByBundle?.length ? (
		<img src={ getImageByProductSlug( slug ) } alt={ name } />
	) : null;

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

	return (
		<AdminPage showHeader={ false } showBackground={ false }>
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col>
					<GoBackLink onClick={ onClickGoBack } />
				</Col>
				<Col>
					<Container
						className={ ! isUpgradableByBundle ? styles.container : null }
						horizontalSpacing={ 0 }
						horizontalGap={ 0 }
						fluid
					>
						<Col sm={ 4 } md={ 4 } lg={ 7 }>
							<ConnectedProductOffer
								slug={ slug }
								trackButtonClick={ trackProductClick }
								onClick={ installsPlugin ? clickHandler : undefined }
								className={ isUpgradableByBundle ? styles.container : null }
							/>
						</Col>
						<Col sm={ 4 } md={ 4 } lg={ 5 } className={ styles.imageContainer }>
							{ bundle ? (
								<ConnectedProductOffer
									slug="security"
									trackButtonClick={ trackBundleClick }
									className={ isUpgradableByBundle ? styles.container : null }
								/>
							) : (
								children || secondarySection
							) }
						</Col>
					</Container>
				</Col>
			</Container>
		</AdminPage>
	);
}

ProductInterstitial.propTypes = {
	// Product slug. Required.
	slug: PropTypes.string.isRequired,
	// The bundle name including this product, eg. 'security'
	installsPlugin: PropTypes.bool,
	// Component children.
	children: PropTypes.node,
};

ProductInterstitial.defaultProps = {
	installsPlugin: false,
	children: null,
};

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
