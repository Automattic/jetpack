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
import { useCallback, useMemo } from 'react';
import useProduct from '../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import { useRedirectToReferrer } from '../../hooks/use-redirect-to-referrer';

/**
 * Product Detail Table Column component.
 *
 * Renders a single column for a product tier, for use in the ProductDetailTable component.
 *
 * @param {object}   props                         - Component props.
 * @param {boolean}  props.cantInstallPlugin       - True when the plugin cannot be automatically installed.
 * @param {Function} props.onProductButtonClick    - Click handler for the product button.
 * @param {object}   props.detail                  - Product detail object.
 * @param {boolean}  props.isFetching              - True if there is a pending request to load the product.
 * @param {string}   props.tier                    - Product tier slug, i.e. 'free' or 'upgraded'.
 * @param {Function} props.trackProductButtonClick - Tracks click event for the product button.
 * @param {boolean}  props.preferProductName       - Whether to show the product name instead of the title.
 * @param {string}   props.feature                 - The slug of the product detail table's highlighted feature.
 * @return {object} - ProductDetailTableColumn component.
 */
const ProductDetailTableColumn = ( {
	cantInstallPlugin,
	onProductButtonClick,
	detail,
	isFetching,
	tier,
	trackProductButtonClick,
	preferProductName,
	feature,
} ) => {
	const { siteSuffix = '', myJetpackCheckoutUri = '' } = getMyJetpackWindowInitialState();

	// Extract the product details.
	const {
		name,
		featuresByTier = [],
		pricingForUi: { tiers: tiersPricingForUi },
		title,
		postCheckoutUrl,
		postCheckoutUrlsByFeature,
		isBundle,
		hasPaidPlanForProduct,
	} = detail;

	// Extract the pricing details for the provided tier.
	const {
		callToAction: customCallToAction,
		currencyCode,
		fullPrice,
		introductoryOffer,
		isFree,
		wpcomProductSlug,
		quantity = null,
	} = tiersPricingForUi[ tier ];

	// Redirect to the referrer URL when the `redirect_to_referrer` query param is present.
	const referrerURL = useRedirectToReferrer();

	/*
	 * Function to handle the redirect URL selection.
	 * - postCheckoutUrl is the URL provided by the product API and is the preferred URL
	 * - referrerURL is the referrer URL, in case the redirect_to_referrer flag was provided
	 * - myJetpackCheckoutUri is the default URL
	 */
	const getCheckoutRedirectUrl = useCallback( () => {
		if ( feature && postCheckoutUrlsByFeature?.[ feature ] ) {
			return postCheckoutUrlsByFeature[ feature ];
		}

		if ( postCheckoutUrl ) {
			return postCheckoutUrl;
		}

		if ( referrerURL ) {
			return referrerURL;
		}

		return myJetpackCheckoutUri;
	}, [ feature, postCheckoutUrlsByFeature, postCheckoutUrl, referrerURL, myJetpackCheckoutUri ] );

	const checkoutRedirectUrl = getCheckoutRedirectUrl();

	// Set up the checkout workflow hook.
	const { run: runCheckout, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		from: 'my-jetpack',
		productSlug: wpcomProductSlug,
		redirectUrl: checkoutRedirectUrl,
		connectAfterCheckout: true,
		siteSuffix,
		useBlogIdSuffix: true,
		quantity,
	} );

	// Compute the price per month.
	const price = fullPrice ? Math.round( ( fullPrice / 12 ) * 100 ) / 100 : null;
	const offPrice = introductoryOffer?.costPerInterval
		? Math.round( ( introductoryOffer.costPerInterval / 12 ) * 100 ) / 100
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

	const productMoniker = name && preferProductName ? name : title;
	const defaultCtaLabel =
		! isBundle && hasPaidPlanForProduct
			? sprintf(
					/* translators: placeholder is product name. */
					__( 'Install %s', 'jetpack-my-jetpack' ),
					productMoniker
			  )
			: sprintf(
					/* translators: placeholder is product name. */
					__( 'Get %s', 'jetpack-my-jetpack' ),
					productMoniker
			  );
	const callToAction =
		customCallToAction ||
		( isFree ? __( 'Start for Free', 'jetpack-my-jetpack' ) : defaultCtaLabel );

	// Register the click handler for the product button.
	const onClick = useCallback( () => {
		trackProductButtonClick( { is_free_plan: isFree, cta_text: callToAction } );
		onProductButtonClick?.( runCheckout, detail, tier );
	}, [
		trackProductButtonClick,
		onProductButtonClick,
		runCheckout,
		detail,
		tier,
		isFree,
		callToAction,
	] );

	return (
		<PricingTableColumn primary={ ! isFree }>
			<PricingTableHeader>
				{ isFree ? (
					<ProductPrice price={ 0 } legend={ '' } currency={ 'USD' } hidePriceFraction />
				) : (
					! hasPaidPlanForProduct && (
						<ProductPrice
							price={ price }
							offPrice={ offPrice }
							legend={ priceDescription }
							currency={ currencyCode }
							hideDiscountLabel={ isOneMonthOffer }
							hidePriceFraction
						/>
					)
				) }
				<Button
					fullWidth
					variant={ isFree ? 'secondary' : 'primary' }
					onClick={ onClick }
					isLoading={ hasCheckoutStarted || isFetching }
					disabled={ hasCheckoutStarted || cantInstallPlugin || isFetching }
				>
					{ callToAction }
				</Button>
			</PricingTableHeader>
			{ featuresByTier.map( ( tierFeature, mapIndex ) => {
				const {
					included,
					description,
					struck_description: struckDescription,
					info,
				} = tierFeature.tiers[ tier ];

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
	preferProductName: PropTypes.bool.isRequired,
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
 * @param {boolean}  props.isFetching              - True if there is a pending request to load the product.
 * @param {boolean}  props.preferProductName       - Whether to show the product name instead of the title.
 * @param {string}   props.feature                 - The slug of a specific product feature to highlight.
 * @return {object} - ProductDetailTable react component.
 */
const ProductDetailTable = ( {
	slug,
	onProductButtonClick,
	trackProductButtonClick,
	isFetching,
	preferProductName,
	feature,
} ) => {
	const { fileSystemWriteAccess = 'no' } = getMyJetpackWindowInitialState();

	const { detail } = useProduct( slug );
	const {
		description,
		featuresByTier = [],
		pluginSlug,
		status,
		tiers = [],
		hasPaidPlanForProduct,
		title,
		pricingForUi: { tiers: tiersPricingForUi },
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
			featuresByTier.map( tierFeature => ( {
				name: tierFeature?.name,
				tooltipTitle: tierFeature?.info?.title,
				tooltipInfo: tierFeature?.info?.content ? (
					// eslint-disable-next-line react/no-danger
					<div dangerouslySetInnerHTML={ { __html: tierFeature?.info?.content } } />
				) : null,
			} ) ),
		[ featuresByTier ]
	);

	const tierIsFree = tier => {
		const { isFree } = tiersPricingForUi[ tier ];
		return isFree;
	};

	return (
		<>
			{ cantInstallPluginNotice }

			<PricingTable title={ description } items={ pricingTableItems }>
				{ tiers.map( ( tier, index ) => {
					// Don't show the column if this is a free offering and we already have a plan
					if ( hasPaidPlanForProduct && tierIsFree( tier ) ) {
						return null;
					}

					return (
						<ProductDetailTableColumn
							key={ index }
							tier={ tier }
							feature={ feature }
							detail={ detail }
							isFetching={ isFetching }
							onProductButtonClick={ onProductButtonClick }
							trackProductButtonClick={ trackProductButtonClick }
							primary={ index === 0 }
							cantInstallPlugin={ cantInstallPlugin }
							preferProductName={ preferProductName }
						/>
					);
				} ) }
			</PricingTable>
		</>
	);
};

ProductDetailTable.propTypes = {
	slug: PropTypes.string.isRequired,
	onProductButtonClick: PropTypes.func.isRequired,
	trackProductButtonClick: PropTypes.func.isRequired,
	isFetching: PropTypes.bool.isRequired,
	preferProductName: PropTypes.bool.isRequired,
};

export default ProductDetailTable;
