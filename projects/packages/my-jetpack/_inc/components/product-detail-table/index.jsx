// eslint-disable-next-line no-unused-vars
/* global myJetpackInitialState */

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
import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';
import { useProduct } from '../../hooks/use-product';

/**
 * Product Detail Table Column component.
 *
 * Renders a single column for a product tier, for use in the ProductDetailTable component.
 *
 * @param {object}   props                         - Component props.
 * @param {boolean}  props.cantInstallPlugin       - True when the plugin cannot be automatically installed.
 * @param {Function} props.onProductButtonClick    - Click handler for the product button.
 * @param {object}   props.detail                  - Product detail object.
 * @param {string}   props.tier                    - Product tier slug, i.e. 'free' or 'upgraded'.
 * @param {Function} props.trackProductButtonClick - Tracks click event for the product button.
 * @returns {object} - ProductDetailTableColumn component.
 */
const ProductDetailTableColumn = ( {
	cantInstallPlugin,
	onProductButtonClick,
	detail,
	tier,
	trackProductButtonClick,
} ) => {
	const { siteSuffix, myJetpackCheckoutUri } = window?.myJetpackInitialState ?? {};

	// Extract the product details.
	const {
		featuresByTier = [],
		pricingForUi: { tiers: tiersPricingForUi },
		title,
		postActivationUrl,
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
		redirectUrl: postActivationUrl.replace( /(^.*\/wp-admin\/)/i, '' ) || myJetpackCheckoutUri,
		siteSuffix,
		useBlogIdSuffix: true,
	} );

	// Register the click handler for the product button.
	const onClick = useCallback( () => {
		trackProductButtonClick();
		onProductButtonClick?.( runCheckout, detail, tier );
	}, [ trackProductButtonClick, onProductButtonClick, runCheckout, detail, tier ] );

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

ProductDetailTableColumn.propTypes = {
	cantInstallPlugin: PropTypes.bool.isRequired,
	onProductButtonClick: PropTypes.func.isRequired,
	detail: PropTypes.object.isRequired,
	tier: PropTypes.string.isRequired,
	trackProductButtonClick: PropTypes.func.isRequired,
};

/**
 * Product Detail Table component.
 *
 * Displays a pricing table, with a column for each product tier.
 *
 * @param {object}   props                         - Component props.
 * @param {string}   props.slug                    - Product slug.
 * @param {Function} props.onProductButtonClick    - Click handler for the product button.
 * @param {Function} props.trackProductButtonClick - Tracks click event for the product button.
 * @returns {object} - ProductDetailTable react component.
 */
const ProductDetailTable = ( { slug, onProductButtonClick, trackProductButtonClick } ) => {
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

	return (
		<>
			{ cantInstallPluginNotice }

			<PricingTable title={ description } items={ pricingTableItems }>
				{ tiers.map( ( tier, index ) => (
					<ProductDetailTableColumn
						key={ index }
						tier={ tier }
						detail={ detail }
						onProductButtonClick={ onProductButtonClick }
						trackProductButtonClick={ trackProductButtonClick }
						primary={ index === 0 }
						cantInstallPlugin={ cantInstallPlugin }
					/>
				) ) }
			</PricingTable>
		</>
	);
};

ProductDetailTable.propTypes = {
	slug: PropTypes.string.isRequired,
	onProductButtonClick: PropTypes.func.isRequired,
	trackProductButtonClick: PropTypes.func.isRequired,
};

export default ProductDetailTable;
