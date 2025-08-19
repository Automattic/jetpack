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
} from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { shouldUseInternalLinks } from '@automattic/jetpack-shared-extension-utils';
import { Spinner } from '@wordpress/components';
import { useCallback, useEffect, useState } from 'react';
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
import ProductInterstitial from './ProductInterstitial';
import { getProductConfigs } from './config';
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
	const { detail } = useProduct( slug );
	const { detail: bundleDetail } = useProduct( config?.bundle );
	const { recordEvent } = useAnalytics();
	const { onClickGoBack } = useGoBack( { slug } );
	const { activate, isPending: isActivating } = useActivatePlugins( slug );
	const { myJetpackCheckoutUri = '' } = getMyJetpackWindowInitialState();
	const { siteIsRegistering, handleRegisterSite } = useMyJetpackConnection( {
		skipUserConnection: true,
		redirectUri: detail?.postActivationUrl || null,
	} );
	const navigateToMyJetpackOverviewPage = useMyJetpackNavigate( MyJetpackRoutes.Home );

	// Track which button is currently loading ('free', 'paid', 'bundle', or null)
	const [ loadingButton, setLoadingButton ] = useState( null );

	// Setup checkout workflows like ProductDetailCard does
	const { siteSuffix = '', adminUrl = '' } = getMyJetpackWindowInitialState();
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
			const { customSlug = null, isFreePlan = false, ctaText = null } = options || {};
			const productSlug = customSlug ? customSlug : config?.bundle ?? slug;
			recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', {
				product: productSlug,
				product_slug: getProductSlugForTrackEvent( isFreePlan ),
				cta_text: ctaText,
			} );
		},
		[ recordEvent, slug, getProductSlugForTrackEvent, config?.bundle ]
	);

	const clickHandler = useCallback(
		( { checkout, product, tier } ) => {
			if ( product?.isBundle ) {
				// Get straight to the checkout page for bundles.
				checkout?.();
				return;
			}

			activate(
				{ productId: slug },
				{
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
								if ( postRegisterRedirectUri ) {
									// Redirect to the product's admin page
									window.location.href = postRegisterRedirectUri;
								} else {
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
		[ myJetpackCheckoutUri, slug, activate, handleRegisterSite, navigateToMyJetpackOverviewPage ]
	);

	const handleGetProduct = useCallback( () => {
		setLoadingButton( 'paid' );
		trackProductOrBundleClick( { ctaText: config?.tiers?.paid?.cta } );
		clickHandler( { checkout: paidCheckoutRun, product: detail, tier: 'paid' } );
	}, [
		trackProductOrBundleClick,
		clickHandler,
		paidCheckoutRun,
		detail,
		config?.tiers?.paid?.cta,
	] );

	const handleGetBundle = useCallback( () => {
		if ( config?.bundle ) {
			setLoadingButton( 'bundle' );
			trackProductOrBundleClick( {
				customSlug: config.bundle,
				ctaText: config?.tiers?.bundle?.cta,
			} );
			clickHandler( { checkout: bundleCheckoutRun, product: bundleDetail, tier: 'bundle' } );
		}
	}, [ trackProductOrBundleClick, clickHandler, bundleCheckoutRun, bundleDetail, config ] );

	const handleFreeActivation = useCallback( () => {
		setLoadingButton( 'free' );
		trackProductOrBundleClick( { isFreePlan: true, ctaText: config?.tiers?.free?.cta } );

		// Products like Search have wpcomFreeProductSlug, so they need checkout even for free
		const hasPurchasableFree = !! detail?.pricingForUi?.wpcomFreeProductSlug;
		const checkout = hasPurchasableFree ? freeCheckoutRun : null;

		clickHandler( { checkout, product: detail, tier: 'free' } );
	}, [
		trackProductOrBundleClick,
		clickHandler,
		detail,
		config?.tiers?.free?.cta,
		freeCheckoutRun,
	] );

	// If no config exists, fallback to old ProductInterstitial
	if ( ! config ) {
		return <ProductInterstitial slug={ slug } installsPlugin={ true } />;
	}

	// Handle tiered pricing like trunk does - check for tiers.upgraded first
	const productPricing = detail?.pricingForUi?.tiers?.upgraded
		? {
				...detail.pricingForUi.tiers.upgraded,
				// Calculate monthly prices from annual if needed
				fullPricePerMonth: detail.pricingForUi.tiers.upgraded.fullPrice / 12,
				discountPricePerMonth: detail.pricingForUi.tiers.upgraded.discountPrice / 12,
		  }
		: detail?.pricingForUi;
	const bundlePricing = bundleDetail?.pricingForUi;

	// Get currency code with USD fallback
	const currencyCode = productPricing?.currencyCode || bundlePricing?.currencyCode || 'USD';

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
									legend=""
									currency={ currencyCode }
									hidePriceFraction
									variant="simple"
								/>
								<Button
									fullWidth
									variant="secondary"
									onClick={ handleFreeActivation }
									isLoading={ loadingButton === 'free' }
									disabled={ loadingButton && loadingButton !== 'free' }
								>
									{ config.tiers.free.cta }
								</Button>
							</PricingTableHeader>
							{ config.features.map( ( feature, index ) => (
								<PricingTableItem
									key={ index }
									isIncluded={ feature.free.included }
									label={ feature.free.label }
								/>
							) ) }
						</PricingTableColumn>
						<PricingTableColumn primary>
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
									fullWidth
									onClick={ handleGetProduct }
									isLoading={ loadingButton === 'paid' }
									disabled={ loadingButton && loadingButton !== 'paid' }
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
						<PricingTableColumn>
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
									fullWidth
									variant="secondary"
									onClick={ handleGetBundle }
									isLoading={ loadingButton === 'bundle' }
									disabled={ loadingButton && loadingButton !== 'bundle' }
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
