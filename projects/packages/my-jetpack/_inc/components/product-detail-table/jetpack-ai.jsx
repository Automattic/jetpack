// eslint-disable-next-line no-unused-vars
/* global myJetpackInitialState */
/**
 * External dependencies
 */
import {
	Button,
	Notice,
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
	ProductPrice,
	Text,
} from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { sprintf, __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo, useEffect } from 'react';
/**
 * Internal dependencies
 */
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import { useProduct } from '../../hooks/use-product';
import { useRedirectToReferrer } from '../../hooks/use-redirect-to-referrer';

const debug = debugFactory( 'my-jetpack:product-detail-table:jetpack-ai' );
/**
 * Product Detail Table Column component.
 *
 * Renders a single column for a product tier, for use in the AiTierDetailTable component.
 *
 * @param {object}   props                         - Component props.
 * @param {boolean}  props.cantInstallPlugin       - True when the plugin cannot be automatically installed.
 * @param {Function} props.onProductButtonClick    - Click handler for the product button.
 * @param {object}   props.detail                  - Product detail object.
 * @param {string}   props.tier                    - Product tier slug, i.e. 'free' or 'upgraded'.
 * @returns {object} - AiTierDetailTableColumn component.
 */
const AiTierDetailTableColumn = ( { cantInstallPlugin, onProductButtonClick, detail, tier } ) => {
	const { siteSuffix, myJetpackCheckoutUri } = window?.myJetpackInitialState ?? {};
	const slug = 'jetpack-ai';
	const { recordEvent } = useAnalytics();

	const referrerUrl = useRedirectToReferrer();

	// Extract the product details.
	const {
		featuresByTier = [],
		pricingForUi: { tiers: tiersPricingForUi },
		postCheckoutUrl,
	} = detail;

	// Extract the pricing details for the provided tier.
	const {
		callToAction,
		currencyCode = 'USD',
		fullPrice = 0,
		introductoryOffer,
		isFree,
		wpcomProductSlug,
		quantity = null,
	} = tiersPricingForUi[ tier ];

	const redirectUrl =
		referrerUrl || // Redirect to the referrer URL when the `redirect_to_referrer` query param is present.
		postCheckoutUrl.replace( /(^.*\/wp-admin\/)/i, '' ) ||
		myJetpackCheckoutUri;

	debug( referrerUrl, postCheckoutUrl, myJetpackCheckoutUri );
	debug( 'after checkout redirect', redirectUrl );

	// Set up the checkout workflow hook.
	const { run: runCheckout, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		from: 'my-jetpack',
		productSlug: wpcomProductSlug,
		redirectUrl,
		connectAfterCheckout: true,
		siteSuffix,
		useBlogIdSuffix: true,
		quantity,
	} );

	// Register the click handler for the product button.
	const onClick = useCallback( () => {
		// we mark current tier as "free", so only track when an actual upgrade is being triggered
		if ( ! isFree ) {
			recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', { product: slug } );
			onProductButtonClick?.( runCheckout, detail, tier );
			return;
		}
		// TODO: simply go back if we have a redirect_to_referrer, into product page otherwise
		recordEvent( 'jetpack_myjetpack_product_interstitial_free_link_click', { product: slug } );
		window.location.href = redirectUrl;
	}, [ recordEvent, onProductButtonClick, runCheckout, detail, tier, isFree, slug, redirectUrl ] );

	// Compute the price per month.
	const price = fullPrice ? Math.round( ( fullPrice / 12 ) * 100 ) / 100 : 0;
	const offPrice = introductoryOffer?.costPerInterval
		? Math.round( ( introductoryOffer.costPerInterval / 12 ) * 100 ) / 100
		: null;
	debug( price );
	const isOneMonthOffer =
		introductoryOffer?.intervalUnit === 'month' && introductoryOffer?.intervalCount === 1;

	const priceDescription = isOneMonthOffer
		? sprintf(
				// translators: %s is the monthly price for a product
				__( 'trial for the first month, then $%s /month, billed yearly', 'jetpack-my-jetpack' ),
				price
		  )
		: __(
				'/month, paid yearly',
				'jetpack-my-jetpack',
				/* dummy arg to avoid bad minification */ 0
		  );

	return (
		<PricingTableColumn primary={ ! isFree }>
			<PricingTableHeader>
				{ isFree ? (
					<ProductPrice price={ 0 } legend={ '' } currency={ 'USD' } hidePriceFraction />
				) : (
					<ProductPrice
						price={ price }
						offPrice={ offPrice }
						legend={ price ? priceDescription : '' }
						currency={ currencyCode }
						hideDiscountLabel={ isOneMonthOffer }
						hidePriceFraction
					/>
				) }
				<Button
					fullWidth
					variant={ isFree ? 'secondary' : 'primary' }
					onClick={ onClick }
					isLoading={ hasCheckoutStarted }
					disabled={ hasCheckoutStarted || cantInstallPlugin }
				>
					{ callToAction }
				</Button>
			</PricingTableHeader>
			{ featuresByTier.map( ( feature, mapIndex ) => {
				const {
					included,
					description,
					struck_description: struckDescription,
					info,
				} = feature.tiers[ tier ];

				const label =
					struckDescription || description ? (
						<>
							{ struckDescription ? (
								<>
									<del>{ struckDescription }</del>{ ' ' }
								</>
							) : null }
							{ description ? <strong>{ description }</strong> : null }
						</>
					) : null;

				return (
					<PricingTableItem
						key={ mapIndex }
						isIncluded={ included }
						label={ label }
						tooltipTitle={ info?.title }
						tooltipInfo={
							// eslint-disable-next-line react/no-danger
							info?.content ? <div dangerouslySetInnerHTML={ { __html: info?.content } } /> : null
						}
						tooltipClassName={ info?.class }
					/>
				);
			} ) }
		</PricingTableColumn>
	);
};

AiTierDetailTableColumn.propTypes = {
	cantInstallPlugin: PropTypes.bool.isRequired,
	onProductButtonClick: PropTypes.func.isRequired,
	detail: PropTypes.object.isRequired,
	tier: PropTypes.string.isRequired,
};

/**
 * Product Detail Table component.
 *
 * Displays a pricing table, with a column for each product tier.
 *
 * @returns {object} - AiTierDetailTable react component.
 */
const AiTierDetailTable = () => {
	const slug = 'jetpack-ai';
	const { fileSystemWriteAccess } = window?.myJetpackInitialState ?? {};

	const { activate, detail } = useProduct( slug );
	const {
		description,
		featuresByTier = [],
		pluginSlug,
		status,
		tiers = [],
		title,
		hasRequiredPlan,
	} = detail;

	// If the plugin can not be installed automatically, the user will have to take extra steps.
	const cantInstallPlugin = 'plugin_absent' === status && 'no' === fileSystemWriteAccess;
	const cantInstallPluginNotice = cantInstallPlugin && (
		<Notice
			level="error"
			hideCloseButton
			title={
				<Text>
					{ sprintf(
						// translators: %s is the plugin name.
						__(
							"Due to your server settings, we can't automatically install the plugin for you. Please manually install the %s plugin.",
							'jetpack-my-jetpack'
						),
						title
					) }
				</Text>
			}
			actions={ [
				<Button
					variant="secondary"
					href={ `https://wordpress.org/plugins/${ pluginSlug }` }
					isExternalLink
				>
					{ __( 'Get plugin', 'jetpack-my-jetpack' ) }
				</Button>,
			] }
		/>
	);

	// The feature list/descriptions for the pricing table.
	const pricingTableItems = useMemo(
		() =>
			featuresByTier.map( feature => ( {
				name: feature?.name,
				tooltipTitle: feature?.info?.title,
				tooltipInfo: feature?.info?.content ? (
					// eslint-disable-next-line react/no-danger
					<div dangerouslySetInnerHTML={ { __html: feature?.info?.content } } />
				) : null,
			} ) ),
		[ featuresByTier ]
	);

	const { recordEvent } = useAnalytics();
	useEffect( () => {
		debug( 'recording visit' );
		recordEvent( 'jetpack_myjetpack_product_interstitial_view', { product: slug } );
	}, [ recordEvent ] );

	const navigateToMyJetpackOverviewPage = useMyJetpackNavigate( '/' );

	const productClickHandler = useCallback(
		( checkout, product, tier ) => {
			debug( tier );
			debug( product );
			if ( hasRequiredPlan ) {
				// Get straight to the checkout page.
				checkout?.();
				return;
			}
			debug( 'no required plan, activating?' );
			activate().finally( () => {
				const postActivationUrl = product?.postActivationUrl;
				const hasRequiredPlanOrTier = tier
					? product?.hasRequiredTier?.[ tier ]
					: product?.hasRequiredPlan;
				const isFree = tier
					? product?.pricingForUi?.tiers?.[ tier ]?.isFree
					: product?.pricingForUi?.isFree;
				const needsPurchase = ! isFree && ! hasRequiredPlanOrTier;

				// If no purchase is needed, redirect the user to the product screen.
				if ( ! needsPurchase ) {
					if ( postActivationUrl ) {
						window.location.href = postActivationUrl;
						return;
					}

					// Fall back to the My Jetpack overview page.
					return navigateToMyJetpackOverviewPage();
				}

				// Redirect to the checkout page.
				checkout?.();
			} );
		},
		[ hasRequiredPlan, activate, navigateToMyJetpackOverviewPage ]
	);

	return (
		<>
			{ cantInstallPluginNotice }

			<PricingTable title={ description } items={ pricingTableItems }>
				{ tiers.map( ( tier, index ) => (
					<AiTierDetailTableColumn
						key={ index }
						tier={ tier }
						detail={ detail }
						onProductButtonClick={ productClickHandler }
						primary={ index === 0 }
						cantInstallPlugin={ cantInstallPlugin }
					/>
				) ) }
			</PricingTable>
		</>
	);
};

export default AiTierDetailTable;
