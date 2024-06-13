/**
 * External dependencies
 */
import {
	AdminPage,
	Button,
	Col,
	Container,
	Text,
	TermsOfService,
} from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import React, { useCallback, useEffect } from 'react';
/**
 * Internal dependencies
 */
import { MyJetpackRoutes } from '../../constants';
import useActivate from '../../data/products/use-activate';
import useProduct from '../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../hooks/use-analytics';
import { useGoBack } from '../../hooks/use-go-back';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import GoBackLink from '../go-back-link';
import ProductDetailCard from '../product-detail-card';
import ProductDetailTable from '../product-detail-table';
import boostImage from './boost.png';
import crmImage from './crm.png';
import extrasImage from './extras.png';
import searchImage from './search.png';
import socialImage from './social.png';
import statsImage from './stats.png';
import styles from './style.module.scss';
import videoPressImage from './videopress.png';

/**
 * Product Interstitial component.
 *
 * @param {object} props                         - Component props.
 * @param {string} props.slug                    - Product slug
 * @param {string} props.bundle                  - Bundle including this product
 * @param {object} props.children                - Product additional content
 * @param {string} props.existingLicenseKeyUrl 	 - URL to enter an existing license key (e.g. Akismet)
 * @param {boolean} props.installsPlugin         - Whether the interstitial button installs a plugin*
 * @param {React.ReactNode} props.supportingInfo - Complementary links or support/legal text
 * @param {boolean} props.preferProductName      - Use product name instead of title
 * @param {string} props.imageContainerClassName - Append a class to the image container
 * @param {string} [props.ctaButtonLabel]        - The label for the Call To Action button
 * @param {boolean} [props.hideTOS]              - Whether to hide the Terms of Service text
 * @param {number} [props.quantity]              - The quantity of the product to purchase
 * @param {number} [props.directCheckout]        - Whether to go straight to the checkout page, e.g. for products with usage tiers
 * @param {boolean} [props.highlightLastFeature] - Whether to highlight the last feature in the list of features
 * @param {object} [props.ctaCallback]           - Callback when the product CTA is clicked. Triggered before any activation/checkout process occurs
 * @returns {object}                               ProductInterstitial react component.
 */
export default function ProductInterstitial( {
	bundle,
	existingLicenseKeyUrl = 'admin.php?page=my-jetpack#/add-license',
	installsPlugin = false,
	slug,
	supportingInfo,
	preferProductName = false,
	children = null,
	imageContainerClassName = '',
	ctaButtonLabel = null,
	hideTOS = false,
	quantity = null,
	directCheckout = false,
	highlightLastFeature = false,
	ctaCallback = null,
} ) {
	const { detail } = useProduct( slug );
	const { detail: bundleDetail } = useProduct( bundle );
	const { activate, isPending: isActivating } = useActivate( slug );

	const { isUpgradableByBundle, tiers, pricingForUi } = detail;
	const { recordEvent } = useAnalytics();
	const { onClickGoBack } = useGoBack( { slug } );
	const { myJetpackCheckoutUri = '' } = getMyJetpackWindowInitialState();
	const { siteIsRegistering, handleRegisterSite } = useConnection( {
		skipUserConnection: true,
		redirectUri: detail.postActivationUrl ? detail.postActivationUrl : null,
	} );
	const showBundledTOS = ! hideTOS && !! bundle;
	const productName = detail?.title;
	const bundleName = bundleDetail?.title;
	const bundledTosLabels = [
		/* translators: %s is the product name  */
		sprintf( __( 'Get %s', 'jetpack-my-jetpack' ), productName ),
		/* translators: %s is the bundled product name */
		sprintf( __( 'Get %s', 'jetpack-my-jetpack' ), bundleName ),
	];

	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_product_interstitial_view', { product: slug } );
	}, [ recordEvent, slug ] );

	const getProductSlugForTrackEvent = useCallback(
		( isFree = false ) => {
			if ( isFree ) {
				return '';
			}
			if ( slug === 'crm' ) {
				return 'jetpack-crm';
			}
			if ( pricingForUi?.tiers?.upgraded?.wpcomProductSlug ) {
				return pricingForUi.tiers.upgraded.wpcomProductSlug;
			}
			return pricingForUi.wpcomProductSlug;
		},
		[ slug, pricingForUi ]
	);

	const trackProductClick = useCallback(
		( isFreePlan = false, customSlug = null ) => {
			recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', {
				product: customSlug ?? slug,
				product_slug: getProductSlugForTrackEvent( isFreePlan ),
			} );
		},
		[ recordEvent, slug, getProductSlugForTrackEvent ]
	);

	const trackBundleClick = useCallback(
		( isFreePlan = false ) => {
			recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', {
				product: bundle,
				product_slug: getProductSlugForTrackEvent( isFreePlan ),
			} );
		},
		[ recordEvent, bundle, getProductSlugForTrackEvent ]
	);

	const navigateToMyJetpackOverviewPage = useMyJetpackNavigate( MyJetpackRoutes.Home );

	const clickHandler = useCallback(
		( checkout, product, tier ) => {
			let postCheckoutUrl = product?.postCheckoutUrl
				? product?.postCheckoutUrl
				: myJetpackCheckoutUri;

			ctaCallback?.( { slug, product, tier } );

			if ( product?.isBundle || directCheckout ) {
				// Get straight to the checkout page.
				checkout?.();
				return;
			}

			activate(
				{ productId: slug },
				{
					onSettled: ( { productId: activatedProduct } ) => {
						postCheckoutUrl = activatedProduct?.post_checkout_url
							? activatedProduct.post_checkout_url
							: myJetpackCheckoutUri;
						// there is a separate hasRequiredTier, but it is not implemented
						const hasPaidPlanForProduct = product?.hasPaidPlanForProduct;
						const isFree = tier
							? product?.pricingForUi?.tiers?.[ tier ]?.isFree
							: product?.pricingForUi?.isFree;
						const isUpgradeToHigherTier =
							tier && product?.pricingForUi?.tiers?.[ tier ] && ! isFree && product?.isUpgradable;
						const needsPurchase = ( ! isFree && ! hasPaidPlanForProduct ) || isUpgradeToHigherTier;

						// If the product is CRM, redirect the user to the Jetpack CRM pricing page.
						// This is done because CRM is not part of the WP billing system
						// and we can't send them to checkout like we can with the rest of the products
						if ( product.pluginSlug === 'zero-bs-crm' && ! hasPaidPlanForProduct ) {
							window.location.href = 'https://jetpackcrm.com/pricing/';
							return;
						}

						// If no purchase is needed, redirect the user to the product screen.
						if ( ! needsPurchase ) {
							// for free products, we still initiate the site connection
							handleRegisterSite().then( redirectUri => {
								if ( ! redirectUri ) {
									// Fall back to the My Jetpack overview page.
									return navigateToMyJetpackOverviewPage();
								}
							} );

							return;
						}

						// Redirect to the checkout page.
						checkout?.( null, postCheckoutUrl );
					},
				}
			);
		},
		[
			directCheckout,
			activate,
			navigateToMyJetpackOverviewPage,
			slug,
			myJetpackCheckoutUri,
			ctaCallback,
			handleRegisterSite,
		]
	);

	return (
		<AdminPage showHeader={ false } showBackground={ false }>
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col className={ styles[ 'product-interstitial__header' ] }>
					<GoBackLink onClick={ onClickGoBack } />
					{ existingLicenseKeyUrl && (
						<Text variant="body-small">
							{ createInterpolateElement(
								__(
									'Already have an existing plan or license key? <a>Get started</a>.',
									'jetpack-my-jetpack'
								),
								{
									a: (
										<Button
											className={ styles[ 'product-interstitial__license-activation-link' ] }
											href={ existingLicenseKeyUrl }
											variant="link"
										/>
									),
								}
							) }
						</Text>
					) }
				</Col>
				<Col>
					{ tiers && tiers.length ? (
						<ProductDetailTable
							slug={ slug }
							clickHandler={ clickHandler }
							onProductButtonClick={ clickHandler }
							trackProductButtonClick={ trackProductClick }
							preferProductName={ preferProductName }
							isFetching={ isActivating || siteIsRegistering }
						/>
					) : (
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
									preferProductName={ preferProductName }
									ctaButtonLabel={ ctaButtonLabel }
									hideTOS={ hideTOS || showBundledTOS }
									quantity={ quantity }
									highlightLastFeature={ highlightLastFeature }
									isFetching={ isActivating || siteIsRegistering }
								/>
							</Col>
							<Col
								sm={ 4 }
								md={ 4 }
								lg={ 5 }
								className={ clsx( styles.imageContainer, imageContainerClassName ) }
							>
								{ bundle ? (
									<ProductDetailCard
										slug={ bundle }
										trackButtonClick={ trackBundleClick }
										onClick={ clickHandler }
										className={ isUpgradableByBundle ? styles.container : null }
										hideTOS={ hideTOS || showBundledTOS }
										quantity={ quantity }
										highlightLastFeature={ highlightLastFeature }
										isFetching={ isActivating }
									/>
								) : (
									children
								) }
							</Col>
						</Container>
					) }
				</Col>
				<Col>
					{ showBundledTOS && (
						<div className={ styles[ 'tos-container' ] }>
							<TermsOfService multipleButtons={ bundledTosLabels } />
						</div>
					) }
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
	const slug = 'anti-spam';
	const { detail } = useProduct( slug );
	const { isPluginActive } = detail;

	return (
		<ProductInterstitial
			slug={ slug }
			installsPlugin={ true }
			bundle="security"
			existingLicenseKeyUrl={ isPluginActive ? 'admin.php?page=akismet-key-config' : null }
			preferProductName={ true }
		/>
	);
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
 * CreatorInterstitial component
 *
 * @returns {object} CreatorInterstitial react component.
 */
export function CreatorInterstitial() {
	return <ProductInterstitial slug="creator" installsPlugin={ true } />;
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
 * JetpackAiInterstitial component
 *
 * @returns {object} JetpackAiInterstitial react component.
 */
export { default as JetpackAiInterstitial } from './jetpack-ai';

/**
 * ProtectInterstitial component
 *
 * @returns {object} ProtectInterstitial react component.
 */
export function ProtectInterstitial() {
	return <ProductInterstitial slug="protect" installsPlugin={ true } />;
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
	return (
		<ProductInterstitial slug="social" installsPlugin={ true }>
			<img
				src={ socialImage }
				alt={ __(
					'Image displaying logos of social media platforms supported by Jetpack Social.',
					'jetpack-my-jetpack'
				) }
			/>
		</ProductInterstitial>
	);
}

/**
 * SearchInterstitial component
 *
 * @returns {object} SearchInterstitial react component.
 */
export function SearchInterstitial() {
	const { detail } = useProduct( 'search' );
	return (
		<ProductInterstitial
			slug="search"
			installsPlugin={ true }
			supportingInfo={
				( detail?.pricingForUi?.trialAvailable
					? __(
							'Jetpack Search Free supports up to 5,000 records and 500 search requests per month for free. You will be asked to upgrade to a paid plan if you exceed these limits for three continuous months.',
							'jetpack-my-jetpack'
					  )
					: '' ) +
				__(
					"For the paid plan, pricing will automatically adjust based on the number of records in your search index. If you grow into a new pricing tier, we'll let you know before your next billing cycle.",
					'jetpack-my-jetpack'
				)
			}
		>
			<img src={ searchImage } alt="Search" />
		</ProductInterstitial>
	);
}

/**
 * StatsInterstitial component
 *
 * @returns {object} StatsInterstitial react component.
 */
export function StatsInterstitial() {
	return (
		<ProductInterstitial
			slug="stats"
			directCheckout={ true }
			installsPlugin={ true }
			ctaButtonLabel={ __( 'Get Stats', 'jetpack-my-jetpack' ) }
		>
			<img
				src={ statsImage }
				alt={ __(
					'Illustration showing the Stats feature, highlighting important statistics for your site.',
					'jetpack-my-jetpack'
				) }
			/>
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
