/**
 * External dependencies
 */
import {
	AdminPage,
	Button,
	Col,
	Container,
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
	ProductPrice,
	Text,
	TermsOfService,
} from '@automattic/jetpack-components';
import { shouldUseInternalLinks } from '@automattic/jetpack-shared-extension-utils';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useEffect } from 'react';
/**
 * Internal dependencies
 */
import { MyJetpackRoutes } from '../../constants';
import useActivatePlugins from '../../data/products/use-activate-plugins';
import useProduct from '../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../hooks/use-analytics';
import { useGoBack } from '../../hooks/use-go-back';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import GoBackLink from '../go-back-link';
import ProductDetailCard from '../product-detail-card';
import ProductDetailTable from '../product-detail-table';
import completeImage from './complete.png';
import { PRODUCT_CONFIGS } from './config';
import extrasImage from './extras.png';
import securityImage from './security.png';
import statsImage from './stats.png';
import styles from './style.module.scss';

/**
 * Product Interstitial component.
 *
 * @param {object}                    props                         - Component props.
 * @param {string}                    props.slug                    - Product slug
 * @param {string}                    props.bundle                  - Bundle including this product
 * @param {object}                    props.children                - Product additional content
 * @param {string}                    props.existingLicenseKeyUrl   - URL to enter an existing license key (e.g. Akismet)
 * @param {boolean}                   props.installsPlugin          - Whether the interstitial button installs a plugin*
 * @param {import('react').ReactNode} props.supportingInfo          - Complementary links or support/legal text
 * @param {boolean}                   props.preferProductName       - Use product name instead of title
 * @param {string}                    props.imageContainerClassName - Append a class to the image container
 * @param {string}                    [props.ctaButtonLabel]        - The label for the Call To Action button
 * @param {boolean}                   [props.hideTOS]               - Whether to hide the Terms of Service text
 * @param {number}                    [props.quantity]              - The quantity of the product to purchase
 * @param {number}                    [props.directCheckout]        - Whether to go straight to the checkout page, e.g. for products with usage tiers
 * @param {boolean}                   [props.highlightLastFeature]  - Whether to highlight the last feature in the list of features
 * @param {object}                    [props.ctaCallback]           - Callback when the product CTA is clicked. Triggered before any activation/checkout process occurs
 * @param {string}                    [props.feature]               - The feature to highlight in the product detail card
 * @return {object} ProductInterstitial react component.
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
	feature = null,
} ) {
	const { detail } = useProduct( slug );
	const { detail: bundleDetail } = useProduct( bundle );
	const { activate, isPending: isActivating, isSuccess } = useActivatePlugins( slug );

	// Get the post activation URL for the product.
	let redirectUri = detail?.postActivationUrl || null;
	// If the interstitial is highlighting a specific feature, use the post checkout URL for that feature, if available.
	if ( feature && detail?.postActivationUrlsByFeature?.[ feature ] ) {
		redirectUri = detail.postActivationUrlsByFeature[ feature ];
	}

	const { isUpgradableByBundle, pricingForUi, isTieredPricing } = detail;
	const { recordEvent } = useAnalytics();
	const { onClickGoBack } = useGoBack( { slug } );
	const { myJetpackCheckoutUri = '' } = getMyJetpackWindowInitialState();
	const { siteIsRegistering, handleRegisterSite } = useMyJetpackConnection( {
		skipUserConnection: true,
		redirectUri,
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
			return pricingForUi?.wpcomProductSlug;
		},
		[ slug, pricingForUi ]
	);

	const trackProductOrBundleClick = useCallback(
		options => {
			const { customSlug = null, isFreePlan = false, ctaText = null } = options || {};
			const productSlug = customSlug ? customSlug : bundle ?? slug;
			recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', {
				product: productSlug,
				product_slug: getProductSlugForTrackEvent( isFreePlan ),
				cta_text: ctaText,
			} );
		},
		[ recordEvent, slug, getProductSlugForTrackEvent, bundle ]
	);

	const navigateToMyJetpackOverviewPage = useMyJetpackNavigate( MyJetpackRoutes.Home );

	const clickHandler = useCallback(
		( checkout, product, tier ) => {
			ctaCallback?.( { slug, product, tier } );

			if ( product?.isBundle || directCheckout ) {
				// Get straight to the checkout page.
				checkout?.();
				return;
			}

			activate(
				{ productId: slug },
				{
					onSettled: activatedProduct => {
						let postCheckoutUrl = activatedProduct?.post_checkout_url || myJetpackCheckoutUri;

						// If the interstitial is highlighting a specific feature, use the post checkout URL for that feature, if available.
						if ( feature && activatedProduct?.post_checkout_urls_by_feature?.[ feature ] ) {
							postCheckoutUrl = activatedProduct.post_checkout_urls_by_feature[ feature ];
						}

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
							handleRegisterSite().then( postRegisterRedirectUri => {
								if ( ! postRegisterRedirectUri ) {
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
			myJetpackCheckoutUri,
			feature,
			ctaCallback,
			slug,
			directCheckout,
			activate,
			handleRegisterSite,
			navigateToMyJetpackOverviewPage,
		]
	);

	return (
		<AdminPage
			showHeader={ false }
			showBackground={ false }
			useInternalLinks={ shouldUseInternalLinks() }
		>
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
					{ isTieredPricing ? (
						<ProductDetailTable
							slug={ slug }
							clickHandler={ clickHandler }
							onProductButtonClick={ clickHandler }
							trackProductButtonClick={ trackProductOrBundleClick }
							preferProductName={ preferProductName }
							isFetching={ isActivating || siteIsRegistering }
							isFetchingSuccess={ isSuccess }
							feature={ feature }
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
									trackButtonClick={ trackProductOrBundleClick }
									onClick={ installsPlugin ? clickHandler : undefined }
									className={ isUpgradableByBundle ? styles.container : null }
									supportingInfo={ supportingInfo }
									preferProductName={ preferProductName }
									ctaButtonLabel={ ctaButtonLabel }
									hideTOS={ hideTOS || showBundledTOS }
									quantity={ quantity }
									highlightLastFeature={ highlightLastFeature }
									isFetching={ isActivating || siteIsRegistering }
									isFetchingSuccess={ isSuccess }
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
										trackButtonClick={ trackProductOrBundleClick }
										onClick={ clickHandler }
										className={ isUpgradableByBundle ? styles.container : null }
										hideTOS={ hideTOS || showBundledTOS }
										quantity={ quantity }
										highlightLastFeature={ highlightLastFeature }
										isFetching={ isActivating }
										isFetchingSuccess={ isSuccess }
										isUpsell={ true }
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
 * @return {object} AntiSpamInterstitial react component.
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
 * Universal PricingInterstitial component
 *
 * @param {object} props      - Component props.
 * @param {string} props.slug - Product slug.
 * @return {object} PricingInterstitial react component.
 */
function PricingInterstitial( { slug } ) {
	const config = PRODUCT_CONFIGS[ slug ];
	const { detail } = useProduct( slug );
	const { detail: bundleDetail } = useProduct( config?.bundle );
	const { recordEvent } = useAnalytics();
	const { onClickGoBack } = useGoBack( { slug } );
	const { activate, isPending: isActivating } = useActivatePlugins( slug );

	const handleGetProduct = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', {
			product: slug,
		} );
		activate( { productId: slug } );
	}, [ recordEvent, activate, slug ] );

	const handleGetBundle = useCallback( () => {
		if ( config?.bundle ) {
			recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', {
				product: config.bundle,
			} );
			activate( { productId: config.bundle } );
		}
	}, [ recordEvent, activate, config ] );

	const handleFreeActivation = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', {
			product: slug,
			product_slug: '',
			cta_text: 'Start for free',
		} );
		activate( { productId: slug } );
	}, [ recordEvent, activate, slug ] );

	// If no config exists, fallback to old ProductInterstitial
	if ( ! config ) {
		return <ProductInterstitial slug={ slug } installsPlugin={ true } />;
	}

	const productPricing = detail?.pricingForUi;
	const bundlePricing = bundleDetail?.pricingForUi;

	return (
		<AdminPage
			showHeader={ false }
			showBackground={ false }
			useInternalLinks={ shouldUseInternalLinks() }
		>
			<Container
				className={ styles.interstitialContainer }
				horizontalSpacing={ 3 }
				horizontalGap={ 3 }
			>
				<Col className={ styles[ 'product-interstitial__header' ] }>
					<GoBackLink onClick={ onClickGoBack } />
				</Col>
				<Col>
					<PricingTable
						title={ config.title }
						items={ config.features }
						showIntroOfferDisclaimer={ false }
						headerLogo={ config.logo ? <config.logo height={ 32 } /> : null }
					>
						<PricingTableColumn>
							<PricingTableHeader title={ config.tiers.free.name }>
								<ProductPrice
									price={ 0 }
									legend="Free forever"
									currency="USD"
									hidePriceFraction
									variant="simple"
								/>
								<Button
									fullWidth
									variant="secondary"
									onClick={ handleFreeActivation }
									isLoading={ isActivating }
								>
									Start for Free
								</Button>
							</PricingTableHeader>
							{ config.features.map( ( _, index ) => (
								<PricingTableItem
									key={ index }
									isIncluded={ index === 0 }
									label={ index === 0 ? config.tiers.free.features[ 0 ] : undefined }
								/>
							) ) }
						</PricingTableColumn>
						<PricingTableColumn primary>
							<PricingTableHeader title={ config.tiers.main.name }>
								<ProductPrice
									price={ productPricing?.fullPricePerMonth || 9.95 }
									offPrice={ productPricing?.discountPricePerMonth || 9.95 }
									legend="/month, billed yearly"
									currency="USD"
									hidePriceFraction
									variant="simple"
								/>
								<Button fullWidth onClick={ handleGetProduct } isLoading={ isActivating }>
									{ config.tiers.main.cta }
								</Button>
							</PricingTableHeader>
							{ config.features.map( ( _, index ) => (
								<PricingTableItem key={ index } isIncluded={ index < 5 } />
							) ) }
						</PricingTableColumn>
						{ config.bundle && (
							<PricingTableColumn>
								<PricingTableHeader title={ config.tiers.bundle.name }>
									<ProductPrice
										price={ bundlePricing?.fullPricePerMonth || 19.95 }
										offPrice={ bundlePricing?.discountPricePerMonth || 14.95 }
										legend="/month, billed yearly"
										currency="USD"
										hidePriceFraction
										variant="simple"
									/>
									<Button
										fullWidth
										variant="secondary"
										onClick={ handleGetBundle }
										isLoading={ isActivating }
									>
										{ config.tiers.bundle.cta }
									</Button>
								</PricingTableHeader>
								{ config.features.map( ( _, index ) => (
									<PricingTableItem key={ index } isIncluded={ true } />
								) ) }
							</PricingTableColumn>
						) }
					</PricingTable>
				</Col>
			</Container>
		</AdminPage>
	);
}

/**
 * BackupInterstitial component
 *
 * @return {object} BackupInterstitial react component.
 */
export function BackupInterstitial() {
	return <PricingInterstitial slug="backup" />;
}

/**
 * BoostInterstitial component
 *
 * @return {object} BoostInterstitial react component.
 */
export function BoostInterstitial() {
	return <PricingInterstitial slug="boost" />;
}

/**
 * CRMInterstitial component
 *
 * @return {object} CRMInterstitial react component.
 */
export function CRMInterstitial() {
	return <PricingInterstitial slug="crm" />;
}

/**
 * ExtrasInterstitial component
 *
 * @return {object} ExtrasInterstitial react component.
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
 * @return {object} JetpackAiInterstitial react component.
 */
export { default as JetpackAiInterstitial } from './jetpack-ai';

/**
 * ProtectInterstitial component
 *
 * @return {object} ProtectInterstitial react component.
 */
export function ProtectInterstitial() {
	return <PricingInterstitial slug="protect" />;
}

/**
 * ScanInterstitial component
 *
 * @return {object} ScanInterstitial react component.
 */
export function ScanInterstitial() {
	return <ProductInterstitial slug="scan" installsPlugin={ true } bundle="security" />;
}

/**
 * SocialInterstitial component
 *
 * @return {object} SocialInterstitial react component.
 */
export function SocialInterstitial() {
	return <PricingInterstitial slug="social" />;
}

/**
 * SearchInterstitial component
 *
 * @return {object} SearchInterstitial react component.
 */
export function SearchInterstitial() {
	return <PricingInterstitial slug="search" />;
}

/**
 * StatsInterstitial component
 *
 * @return {object} StatsInterstitial react component.
 */
export function StatsInterstitial() {
	return <PricingInterstitial slug="stats" />;
}

/**
 * VideoPressInterstitial component
 *
 * @return {object} VideoPressInterstitial react component.
 */
export function VideoPressInterstitial() {
	return <PricingInterstitial slug="videopress" />;
}

/**
 * SecurityInterstitial component
 *
 * @return {object} SecurityInterstitial react component.
 */
export function SecurityInterstitial() {
	return (
		<ProductInterstitial slug="security" installsPlugin={ true }>
			<img src={ securityImage } alt="Security" />
		</ProductInterstitial>
	);
}

/**
 * GrowthInterstitial component
 *
 * @return {object} GrowthInterstitial react component.
 */
export function GrowthInterstitial() {
	return (
		<ProductInterstitial slug="growth" installsPlugin={ true }>
			<img src={ statsImage } alt="Growth" />
		</ProductInterstitial>
	);
}

/**
 * CompleteInterstitial component
 *
 * @return {object} CompleteInterstitial react component.
 */
export function CompleteInterstitial() {
	return (
		<ProductInterstitial slug="complete" installsPlugin={ true }>
			<img src={ completeImage } alt="Complete" />
		</ProductInterstitial>
	);
}
