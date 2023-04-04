// eslint-disable-next-line no-unused-vars
/* global myJetpackInitialState */

import {
	Button,
	getRedirectUrl,
	Notice,
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
	ProductPrice,
	Text,
} from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import React, { useCallback, useMemo } from 'react';
import { useProduct } from '../../hooks/use-product';

/**
 * Product Detail Table Column component.
 *
 * Renders a single column for a product tier, for use in the ProductDetailTable component.
 *
 * @param {object}   props                   - Component props.
 * @param {boolean}  props.cantInstallPlugin - True when the plugin cannot be automatically installed.
 * @param {Function} props.clickHandler      - Click handler for the product button.
 * @param {object}   props.detail            - Product detail object.
 * @param {string}   props.tier              - Product tier slug, i.e. 'free' or 'upgraded'.
 * @param {Function} props.trackButtonClick  - Tracks click event for the product button.
 * @returns {object} - ProductDetailTableColumn component.
 */
const ProductDetailTableColumn = ( {
	cantInstallPlugin,
	clickHandler,
	detail,
	tier,
	trackButtonClick,
} ) => {
	const { siteSuffix, myJetpackUrl } = window?.myJetpackInitialState ?? {};

	// Extract the product details.
	const {
		featuresByTier = [],
		pricingForUi: { tiers: tiersPricingForUi },
		title,
	} = detail;

	// Extract the pricing details for the provided tier.
	const {
		callToAction: customCallToAction,
		currencyCode,
		fullPrice,
		introductoryOffer,
		isFree,
		wpcomProductSlug,
	} = tiersPricingForUi[ tier ];

	// Set up the checkout workflow hook.
	const { run: runCheckout, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		from: 'my-jetpack',
		productSlug: wpcomProductSlug,
		redirectUrl: myJetpackUrl,
		siteSuffix,
	} );

	// Register the click handler for the product button.
	const onClick = useCallback( () => {
		trackButtonClick();
		clickHandler?.( runCheckout, detail, tier );
	}, [ trackButtonClick, clickHandler, runCheckout, detail, tier ] );

	// Compute the price per month.
	const price = fullPrice ? Math.ceil( ( fullPrice / 12 ) * 100 ) / 100 : null;
	const offPrice = introductoryOffer?.costPerInterval
		? Math.ceil( ( introductoryOffer.costPerInterval / 12 ) * 100 ) / 100
		: null;

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

	const callToAction =
		customCallToAction ||
		( isFree
			? __( 'Start for Free', 'jetpack-my-jetpack' )
			: sprintf(
					/* translators: placeholder is product name. */
					__( 'Get %s', 'jetpack-my-jetpack' ),
					title,
					/* dummy arg to avoid bad minification */ 0
			  ) );

	return (
		<PricingTableColumn primary={ ! isFree }>
			<PricingTableHeader>
				{ isFree ? (
					<ProductPrice price={ 0 } legend={ '' } currency={ 'USD' } hidePriceFraction />
				) : (
					<ProductPrice
						price={ price }
						offPrice={ offPrice }
						legend={ priceDescription }
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

				return (
					<PricingTableItem
						key={ mapIndex }
						isIncluded={ included }
						label={
							struckDescription || description ? (
								<>
									{ struckDescription ? (
										<>
											<del>{ struckDescription }</del>{ ' ' }
										</>
									) : null }
									{ description ? <strong>{ description }</strong> : null }
								</>
							) : null
						}
						tooltipTitle={ info?.title }
						tooltipInfo={ info?.content }
					/>
				);
			} ) }
		</PricingTableColumn>
	);
};

/**
 * Product Detail Table component.
 *
 * Displays a pricing table, with a column for each product tier.
 *
 * @param {object}   props                  - Component props.
 * @param {string}   props.slug             - Product slug.
 * @param {Function} props.clickHandler     - Click handler for the product button.
 * @param {Function} props.trackButtonClick - Tracks click event for the product button.
 * @returns {object} - ProductDetailTable react component.
 */
const ProductDetailTable = ( { slug, clickHandler, trackButtonClick } ) => {
	const { fileSystemWriteAccess } = window?.myJetpackInitialState ?? {};

	const { detail } = useProduct( slug );
	const { description, featuresByTier = [], pluginSlug, status, tiers = [], title } = detail;

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
			featuresByTier.map( feature => {
				const { content, link } = feature?.info || {};

				const learnMoreLink =
					Boolean( link ) &&
					createInterpolateElement(
						sprintf(
							/** translators: placeholder is the clickable title of the "learn more" link. */
							__( 'Learn more on <link>%s</link>.', 'jetpack-my-jetpack' ),
							link?.title
						),
						{
							link: <a href={ getRedirectUrl( link?.id ) } target="_blank" rel="noreferrer" />,
						}
					);

				const tooltipInfo =
					content || learnMoreLink ? (
						<>
							{ content } { learnMoreLink }
						</>
					) : null;

				return {
					name: feature?.name,
					tooltipTitle: feature?.info?.title,
					tooltipInfo,
				};
			} ),
		[ featuresByTier ]
	);

	return (
		<>
			{ cantInstallPluginNotice }

			<PricingTable title={ description } items={ pricingTableItems }>
				{ tiers.map( ( tier, index ) => (
					<ProductDetailTableColumn
						key={ index }
						tier={ tier }
						detail={ detail }
						clickHandler={ clickHandler }
						trackButtonClick={ trackButtonClick }
						primary={ index === 0 }
						cantInstallPlugin={ cantInstallPlugin }
					/>
				) ) }
			</PricingTable>
		</>
	);
};

export default ProductDetailTable;
