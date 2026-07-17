/**
 * External dependencies
 */
import {
	AdminPage,
	Col,
	Container,
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
	ProductPrice,
} from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { getScriptData, getMyJetpackUrl } from '@automattic/jetpack-script-data';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import { MyJetpackRoutes } from '../../constants';
import useActivatePlugins from '../../data/products/use-activate-plugins';
import useProduct from '../../data/products/use-product';
import useAnalytics from '../../hooks/use-analytics';
import { useGoBack } from '../../hooks/use-go-back';
import { useInterstitialsState } from '../../hooks/use-interstitials-state';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import GoBackLink from '../go-back-link';
import { getProductConfigs } from './config';
import ProductInterstitial from './product-interstitial';
import styles from './style.module.scss';

/**
 * Universal PricingInterstitial component
 *
 * @param {object} props      - Component props.
 * @param {string} props.slug - Product slug.
 * @return {object} PricingInterstitial react component.
 */
export default function PricingInterstitial( { slug } ) {
	const config = getProductConfigs()[ slug ];
	const { detail, isLoading: isProductLoading } = useProduct( slug );
	const { detail: bundleDetail, isLoading: isBundleLoading } = useProduct( config?.bundle );
	const { recordEvent } = useAnalytics();
	const { onClickGoBack } = useGoBack( { slug, fallback: '/products' } );
	const { activate, isPending: isActivating } = useActivatePlugins( slug );
	const myJetpackCheckoutUri = getMyJetpackUrl();
	const { siteIsRegistering, handleRegisterSite } = useMyJetpackConnection( {
		skipUserConnection: true,
		redirectUri: detail?.postActivationUrl || null,
	} );
	const navigateToMyJetpackOverviewPage = useMyJetpackNavigate( MyJetpackRoutes.Home );

	// Track which button is currently loading ('free', 'paid', 'bundle', or null)
	const [ loadingButton, setLoadingButton ] = useState( null );

	// Disable all buttons when any action is in progress or data is loading
	const buttonsDisabled = Boolean( loadingButton ) || isProductLoading;

	// Setup checkout workflows like ProductDetailCard does
	const { admin_url: adminUrl, suffix: siteSuffix } = getScriptData().site;
	const paidCheckoutRedirectUrl = detail?.postActivationUrl || myJetpackCheckoutUri;
	const bundleCheckoutRedirectUrl = bundleDetail?.postActivationUrl || myJetpackCheckoutUri;

	const { run: paidCheckoutRun } = useProductCheckoutWorkflow( {
		productSlug:
			detail?.pricingForUi?.tiers?.upgraded?.wpcomProductSlug ||
			detail?.pricingForUi?.wpcomProductSlug,
		redirectUrl: paidCheckoutRedirectUrl,
		siteSuffix,
		adminUrl,
		connectAfterCheckout: true,
		from: 'my-jetpack',
		useBlogIdSuffix: true,
	} );

	const { run: bundleCheckoutRun } = useProductCheckoutWorkflow( {
		productSlug: bundleDetail?.pricingForUi?.wpcomProductSlug,
		redirectUrl: bundleCheckoutRedirectUrl,
		siteSuffix,
		adminUrl,
		connectAfterCheckout: true,
		from: 'my-jetpack',
		useBlogIdSuffix: true,
	} );

	const { run: freeCheckoutRun } = useProductCheckoutWorkflow( {
		productSlug: detail?.pricingForUi?.wpcomFreeProductSlug,
		redirectUrl: paidCheckoutRedirectUrl,
		siteSuffix,
		adminUrl,
		connectAfterCheckout: true,
		from: 'my-jetpack',
		useBlogIdSuffix: true,
	} );

	// Handle tiered pricing like trunk does - check for tiers.upgraded first
	const productPricing = useMemo( () => {
		return detail?.pricingForUi?.tiers?.upgraded
			? {
					...detail.pricingForUi.tiers.upgraded,
					// Calculate monthly prices from annual if needed
					fullPricePerMonth: detail.pricingForUi.tiers.upgraded.fullPrice / 12,
					discountPricePerMonth: detail.pricingForUi.tiers.upgraded.discountPrice / 12,
			  }
			: detail?.pricingForUi;
	}, [ detail?.pricingForUi ] );

	const bundlePricing = useMemo( () => {
		return bundleDetail?.pricingForUi;
	}, [ bundleDetail?.pricingForUi ] );

	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_product_interstitial_view', { product: slug } );
	}, [ recordEvent, slug ] );

	// Reset loading button when activation completes or site registration completes
	useEffect( () => {
		if ( ! isActivating && ! siteIsRegistering ) {
			setLoadingButton( null );
		}
	}, [ isActivating, siteIsRegistering ] );

	const getProductSlugForTrackEvent = useCallback(
		( isFree = false ) => {
			if ( isFree ) {
				return '';
			}
			if ( slug === 'crm' ) {
				return 'jetpack-crm';
			}
			if ( detail?.pricingForUi?.tiers?.upgraded?.wpcomProductSlug ) {
				return detail.pricingForUi.tiers.upgraded.wpcomProductSlug;
			}
			return detail?.pricingForUi?.wpcomProductSlug;
		},
		[ slug, detail?.pricingForUi ]
	);

	const trackProductOrBundleClick = useCallback(
		options => {
			const {
				customSlug = null,
				isFreePlan = false,
				ctaText = null,
				tier = null,
				hasDiscount = false,
			} = options || {};
			const productSlug = customSlug ? customSlug : config?.bundle ?? slug;
			recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', {
				product: productSlug,
				product_slug: getProductSlugForTrackEvent( isFreePlan ),
				cta_text: ctaText,
				tier_selected: tier,
				has_discount: hasDiscount,
			} );
		},
		[ recordEvent, slug, getProductSlugForTrackEvent, config?.bundle ]
	);

	const clickHandler = useCallback(
		( { checkout, product, tier } ) => {
			if ( product?.isBundle ) {
				// Get straight to the checkout page for bundles.
				try {
					checkout?.();
				} catch ( error ) {
					recordEvent( 'jetpack_myjetpack_interstitial_loading_error', {
						product_slug: slug,
						error_type: 'checkout_failed',
						tier_attempted: 'bundle',
						error_message: error?.message || 'Bundle checkout failed',
					} );
					throw error; // Re-throw to preserve existing behavior
				}
				return;
			}

			activate(
				{ productId: slug },
				{
					onError: error => {
						recordEvent( 'jetpack_myjetpack_interstitial_loading_error', {
							product_slug: slug,
							error_type: 'plugin_activation_failed',
							tier_attempted: tier || 'unknown',
							error_message: error?.message || 'Unknown activation error',
						} );
					},
					onSettled: activatedProduct => {
						const postCheckoutUrl = activatedProduct?.post_checkout_url || myJetpackCheckoutUri;

						// there is a separate hasRequiredTier, but it is not implemented
						const hasPaidPlanForProduct = product?.hasPaidPlanForProduct;
						// Products like Search have wpcomFreeProductSlug, meaning even their "free" tier needs purchase
						const hasPurchasableFree = !! product?.pricingForUi?.wpcomFreeProductSlug;
						let isFree;
						if ( tier === 'free' && ! hasPurchasableFree ) {
							isFree = true;
						} else if ( tier ) {
							isFree = product?.pricingForUi?.tiers?.[ tier ]?.isFree;
						} else {
							isFree = product?.pricingForUi?.isFree;
						}
						const isUpgradeToHigherTier =
							tier && product?.pricingForUi?.tiers?.[ tier ] && ! isFree && product?.isUpgradable;
						const needsPurchase = ( ! isFree && ! hasPaidPlanForProduct ) || isUpgradeToHigherTier;

						// If no purchase is needed, redirect the user to the product screen.
						if ( ! needsPurchase ) {
							// for free products, we still initiate the site connection
							handleRegisterSite()
								.then( postRegisterRedirectUri => {
									if ( postRegisterRedirectUri ) {
										// Redirect to the product's admin page
										window.location.href = postRegisterRedirectUri;
									} else {
										// Fall back to the My Jetpack overview page.
										return navigateToMyJetpackOverviewPage();
									}
								} )
								.catch( error => {
									recordEvent( 'jetpack_myjetpack_interstitial_loading_error', {
										product_slug: slug,
										error_type: 'site_registration_failed',
										tier_attempted: tier || 'unknown',
										error_message: error?.message || 'Site registration failed',
									} );
									throw error; // Re-throw to preserve existing behavior
								} );

							return;
						}

						// If the product is CRM, redirect the user to the Jetpack CRM pricing page.
						// This is done because CRM is not part of the WP billing system
						// and we can't send them to checkout like we can with the rest of the products
						if ( product.pluginSlug === 'zero-bs-crm' && ! hasPaidPlanForProduct ) {
							window.location.href = 'https://jetpackcrm.com/pricing/';
							return;
						}

						// Redirect to the checkout page.
						try {
							checkout?.( null, postCheckoutUrl );
						} catch ( error ) {
							recordEvent( 'jetpack_myjetpack_interstitial_loading_error', {
								product_slug: slug,
								error_type: 'checkout_failed',
								tier_attempted: tier || 'unknown',
								error_message: error?.message || 'Checkout failed',
							} );
							throw error; // Re-throw to preserve existing behavior
						}
					},
				}
			);
		},
		[
			myJetpackCheckoutUri,
			slug,
			activate,
			handleRegisterSite,
			navigateToMyJetpackOverviewPage,
			recordEvent,
		]
	);

	const handleGetProduct = useCallback( () => {
		setLoadingButton( 'paid' );

		// Calculate discount for paid tier
		const paidHasDiscount =
			productPricing?.discountPricePerMonth &&
			productPricing.discountPricePerMonth < productPricing.fullPricePerMonth;

		trackProductOrBundleClick( {
			ctaText: config?.tiers?.paid?.cta,
			tier: 'paid',
			hasDiscount: paidHasDiscount || false,
		} );
		clickHandler( { checkout: paidCheckoutRun, product: detail, tier: 'paid' } );
	}, [
		trackProductOrBundleClick,
		clickHandler,
		paidCheckoutRun,
		detail,
		config?.tiers?.paid?.cta,
		productPricing,
	] );

	const handleGetBundle = useCallback( () => {
		if ( config?.bundle ) {
			setLoadingButton( 'bundle' );

			// Calculate discount for bundle
			const bundleHasDiscount =
				bundlePricing?.discountPricePerMonth &&
				bundlePricing.discountPricePerMonth < bundlePricing.fullPricePerMonth;

			trackProductOrBundleClick( {
				customSlug: config.bundle,
				ctaText: config?.tiers?.bundle?.cta,
				tier: 'bundle',
				hasDiscount: bundleHasDiscount || false,
			} );
			clickHandler( { checkout: bundleCheckoutRun, product: bundleDetail, tier: 'bundle' } );
		}
	}, [
		trackProductOrBundleClick,
		clickHandler,
		bundleCheckoutRun,
		bundleDetail,
		config,
		bundlePricing,
	] );

	const { update: updateInterstitialsState } = useInterstitialsState();

	const handleFreeActivation = useCallback( () => {
		if ( ! config?.tiers?.free ) {
			return;
		}
		setLoadingButton( 'free' );
		trackProductOrBundleClick( {
			isFreePlan: true,
			ctaText: config.tiers.free.cta,
			tier: 'free',
			hasDiscount: false, // Free tier never has discount
		} );

		// Products like Search have wpcomFreeProductSlug, so they need checkout even for free
		const hasPurchasableFree = !! detail?.pricingForUi?.wpcomFreeProductSlug;
		const checkout = hasPurchasableFree ? freeCheckoutRun : null;

		updateInterstitialsState(
			{ [ slug ]: true },
			{
				onSettled() {
					clickHandler( { checkout, product: detail, tier: 'free' } );
				},
			}
		);
	}, [
		trackProductOrBundleClick,
		clickHandler,
		detail,
		config?.tiers?.free,
		freeCheckoutRun,
		updateInterstitialsState,
		slug,
	] );

	const handleLicenseActivationClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_interstitial_license_link_click', {
			product_slug: slug,
		} );
	}, [ recordEvent, slug ] );

	const handleGoBack = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_interstitial_go_back', {
			product_slug: slug,
		} );

		// Call the original go back functionality
		onClickGoBack();
	}, [ recordEvent, slug, onClickGoBack ] );

	// If no config exists, fallback to old ProductInterstitial
	if ( ! config ) {
		return <ProductInterstitial slug={ slug } installsPlugin={ true } />;
	}

	// Get currency code with USD fallback
	const currencyCode = productPricing?.currencyCode || bundlePricing?.currencyCode || 'USD';

	return (
		<AdminPage
			showBackground={ false }
			breadcrumbs={
				<GoBackLink
					onClick={ handleGoBack }
					to="/products"
					label={ __( 'My Jetpack', 'jetpack-my-jetpack' ) }
				/>
			}
			actions={
				<Button
					size="compact"
					variant="outline"
					nativeButton={ false }
					render={ <a href={ getMyJetpackUrl( '#/add-license' ) } /> }
					onClick={ handleLicenseActivationClick }
				>
					{ __( 'Use license key', 'jetpack-my-jetpack' ) }
				</Button>
			}
		>
			<Container
				className={ styles.interstitialContainer }
				horizontalSpacing={ 3 }
				horizontalGap={ 2 }
			>
				<Col>
					<PricingTable
						title={ config.title }
						items={ config.features }
						showIntroOfferDisclaimer={ false }
						headerLogo={ config.logo ? <config.logo height={ 32 } /> : null }
					>
						{ config.tiers.free && (
							<PricingTableColumn className={ styles[ 'pricing-column' ] }>
								<PricingTableHeader title={ config.tiers.free.name }>
									<ProductPrice
										price={ 0 }
										legend=""
										currency={ currencyCode }
										hidePriceFraction
										variant="simple"
									/>
									<Button
										className={ styles[ 'tier-cta' ] }
										variant="outline"
										onClick={ handleFreeActivation }
										loading={ loadingButton === 'free' }
										disabled={ buttonsDisabled }
									>
										{ config.tiers.free.cta }
									</Button>
								</PricingTableHeader>
								{ config.features.map( ( feature, index ) => (
									<PricingTableItem
										key={ index }
										isIncluded={ feature.free?.included || false }
										label={ feature.free?.label || '' }
									/>
								) ) }
							</PricingTableColumn>
						) }
						<PricingTableColumn primary className={ styles[ 'pricing-column' ] }>
							<PricingTableHeader title={ config.tiers.paid.name }>
								{ productPricing ? (
									<ProductPrice
										price={ productPricing.fullPricePerMonth }
										offPrice={
											productPricing.discountPricePerMonth === productPricing.fullPricePerMonth
												? null
												: productPricing.discountPricePerMonth
										}
										legend="/month, billed yearly"
										currency={ currencyCode }
										hidePriceFraction
										variant="simple"
									/>
								) : (
									<Spinner className={ styles.spinner } />
								) }
								<Button
									className={ styles[ 'tier-cta' ] }
									onClick={ handleGetProduct }
									loading={ loadingButton === 'paid' }
									disabled={ buttonsDisabled }
								>
									{ config.tiers.paid.cta }
								</Button>
							</PricingTableHeader>
							{ config.features.map( ( feature, index ) => (
								<PricingTableItem
									key={ index }
									isIncluded={ feature.paid.included }
									label={ feature.paid.label }
								/>
							) ) }
						</PricingTableColumn>
						<PricingTableColumn className={ styles[ 'pricing-column' ] }>
							<PricingTableHeader title={ config.tiers.bundle.name }>
								{ bundlePricing ? (
									<ProductPrice
										price={ bundlePricing.fullPricePerMonth }
										offPrice={ bundlePricing.discountPricePerMonth }
										legend="/month, billed yearly"
										currency={ currencyCode }
										hidePriceFraction
										variant="simple"
									/>
								) : (
									<Spinner className={ styles.spinner } />
								) }
								<Button
									className={ styles[ 'tier-cta' ] }
									variant="outline"
									onClick={ handleGetBundle }
									loading={ loadingButton === 'bundle' }
									disabled={ buttonsDisabled || isBundleLoading }
								>
									{ config.tiers.bundle.cta }
								</Button>
							</PricingTableHeader>
							{ config.features.map( ( feature, index ) => (
								<PricingTableItem
									key={ index }
									isIncluded={ feature.bundle.included }
									label={ feature.bundle.label }
								/>
							) ) }
						</PricingTableColumn>
					</PricingTable>
				</Col>
			</Container>
		</AdminPage>
	);
}
