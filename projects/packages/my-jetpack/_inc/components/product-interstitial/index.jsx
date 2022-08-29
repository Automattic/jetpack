import { Container, Col, AdminPage } from '@automattic/jetpack-components';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React, { useCallback, useEffect } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import { useProduct } from '../../hooks/use-product';
import { STORE_ID } from '../../state/store';
import getProductCheckoutUrl from '../../utils/get-product-checkout-url';
import GoBackLink from '../go-back-link';
import ProductDetailCard from '../product-detail-card';
import boostImage from './boost.png';
import crmImage from './crm.png';
import extrasImage from './extras.png';
import searchImage from './search.png';
import styles from './style.module.scss';
import videoPressImage from './videopress.png';

/**
 * Product Interstitial component.
 *
 * @param {object} props                         - Component props.
 * @param {string} props.slug                    - Product slug
 * @param {string} props.bundle                  - Bundle including this product
 * @param {object} props.children                - Product additional content
 * @param {boolean} props.installsPlugin         - Whether the interstitial button installs a plugin*
 * @param {React.ReactNode} props.supportingInfo - Complementary links or support/legal text
 * @returns {object}                               ProductInterstitial react component.
 */
export default function ProductInterstitial( {
	bundle,
	installsPlugin = false,
	slug,
	supportingInfo,
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
							<ProductDetailCard
								slug={ slug }
								trackButtonClick={ trackProductClick }
								onClick={ installsPlugin ? clickHandler : undefined }
								className={ isUpgradableByBundle ? styles.container : null }
								supportingInfo={ supportingInfo }
							/>
						</Col>
						<Col sm={ 4 } md={ 4 } lg={ 5 } className={ styles.imageContainer }>
							{ bundle ? (
								<ProductDetailCard
									slug="security"
									trackButtonClick={ trackBundleClick }
									className={ isUpgradableByBundle ? styles.container : null }
								/>
							) : (
								children
							) }
						</Col>
					</Container>
				</Col>
			</Container>
		</AdminPage>
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
 * SocialInterstitial component
 *
 * @returns {object} SocialInterstitial react component.
 */
export function SocialInterstitial() {
	return <ProductInterstitial slug="social" installsPlugin={ true } />;
}

/**
 * SearchInterstitial component
 *
 * @returns {object} SearchInterstitial react component.
 */
export function SearchInterstitial() {
	return (
		<ProductInterstitial
			slug="search"
			installsPlugin={ true }
			supportingInfo={ __(
				"Pricing will automatically adjust based on the number of records in your search index. If you grow into a new pricing tier, we'll let you know before your next billing cycle.",
				'jetpack-my-jetpack'
			) }
		>
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
