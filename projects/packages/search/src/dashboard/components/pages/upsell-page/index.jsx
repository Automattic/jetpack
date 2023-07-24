import {
	AdminPage,
	Container,
	Col,
	PricingCard,
	AdminSectionHero,
	ProductPrice,
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
	IconTooltip,
	Button,
	ThemeProvider,
} from '@automattic/jetpack-components';
import { ConnectionError, useConnectionErrorNotice } from '@automattic/jetpack-connection';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import Loading from 'components/loading';
import Price from 'components/price';
import SearchPromotionBlock from 'components/search-promotion';
import useProductCheckoutWorkflow from 'hooks/use-product-checkout-workflow';
import React, { useCallback } from 'react';
import { STORE_ID } from 'store';
import Header from './header';

import './styles.scss';

const JETPACK_SEARCH__LINK = 'https://jetpack.com/upgrade/search';

/**
 * defines UpsellPage.
 *
 * @param {object} props - Component properties.
 * @param {string} props.isLoading - should page show Loading spinner.
 * @returns {React.Component} UpsellPage component.
 */
export default function UpsellPage( { isLoading = false } ) {
	// Introduce the gate for new pricing with URL parameter `new_pricing_202208=1`
	const isNewPricing = useSelect( select => select( STORE_ID ).isNewPricing202208(), [] );
	useSelect( select => select( STORE_ID ).getSearchPricing(), [] );
	const domain = useSelect( select => select( STORE_ID ).getCalypsoSlug(), [] );
	const adminUrl = useSelect( select => select( STORE_ID ).getSiteAdminUrl(), [] );
	const isWpcom = useSelect( select => select( STORE_ID ).isWpcom(), [] );

	const { fetchSearchPlanInfo } = useDispatch( STORE_ID );
	const checkSiteHasSearchProduct = useCallback(
		() => fetchSearchPlanInfo().then( response => response?.supports_search ),
		[ fetchSearchPlanInfo ]
	);

	const { run: sendToCartPaid, hasCheckoutStarted: hasCheckoutStartedPaid } =
		useProductCheckoutWorkflow( {
			productSlug: 'jetpack_search',
			adminUrl,
			redirectUri: 'admin.php?page=jetpack-search&just_upgraded=1',
			siteProductAvailabilityHandler: checkSiteHasSearchProduct,
			from: 'jetpack-search',
			siteSuffix: domain,
			isWpcom,
		} );

	const { run: sendToCartFree, hasCheckoutStarted: hasCheckoutStartedFree } =
		useProductCheckoutWorkflow( {
			productSlug: 'jetpack_search_free',
			adminUrl,
			redirectUri: 'admin.php?page=jetpack-search',
			siteProductAvailabilityHandler: checkSiteHasSearchProduct,
			from: 'jetpack-search',
			siteSuffix: domain,
			isWpcom,
		} );

	const isPageLoading = useSelect(
		select =>
			select( STORE_ID ).isResolving( 'getSearchPricing' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchPricing' ) ||
			hasCheckoutStartedPaid ||
			hasCheckoutStartedFree ||
			isLoading,
		[ isLoading, hasCheckoutStartedPaid, hasCheckoutStartedFree ]
	);

	return (
		<>
			{ isPageLoading && <Loading /> }
			{ ! isPageLoading && (
				<div className="jp-search-dashboard-upsell-page">
					<AdminPage
						moduleName={ __( 'Jetpack Search', 'jetpack-search-pkg' ) }
						header={ <Header /> }
						moduleNameHref={ JETPACK_SEARCH__LINK }
					>
						<AdminSectionHero>
							{ isNewPricing ? (
								<NewPricingComponent
									sendToCartPaid={ sendToCartPaid }
									sendToCartFree={ sendToCartFree }
								/>
							) : (
								<OldPricingComponent sendToCart={ sendToCartPaid } />
							) }
						</AdminSectionHero>
					</AdminPage>
				</div>
			) }
		</>
	);
}

const OldPricingComponent = ( { sendToCart } ) => {
	// For old pricing card
	const priceBefore = useSelect( select => select( STORE_ID ).getPriceBefore() / 12, [] );
	const priceAfter = useSelect( select => select( STORE_ID ).getPriceAfter() / 12, [] );
	const priceCurrencyCode = useSelect( select => select( STORE_ID ).getPriceCurrencyCode(), [] );
	const basicInfoText = __( '14 day money back guarantee.', 'jetpack-search-pkg' );
	const onSaleInfoText = __(
		'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
		'jetpack-search-pkg'
	);
	const { hasConnectionError } = useConnectionErrorNotice();

	return (
		<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
			{ hasConnectionError && (
				<Col lg={ 12 } md={ 12 } sm={ 12 }>
					<ConnectionError />
				</Col>
			) }
			<Col lg={ 6 } md={ 6 } sm={ 4 }>
				<h1>{ __( 'The best WordPress search experience', 'jetpack-search-pkg' ) }</h1>
				<SearchPromotionBlock />
			</Col>
			<Col lg={ 1 } md={ 1 } sm={ 0 } />
			<Col lg={ 5 } md={ 6 } sm={ 4 }>
				<PricingCard
					ctaText={ __( 'Get Jetpack Search', 'jetpack-search-pkg' ) }
					icon="data:image/svg+xml,%3Csvg width='32' height='32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M21 19l-5.154-5.154C16.574 12.742 17 11.42 17 10c0-3.866-3.134-7-7-7s-7 3.134-7 7 3.134 7 7 7c1.42 0 2.742-.426 3.846-1.154L19 21l2-2zM5 10c0-2.757 2.243-5 5-5s5 2.243 5 5-2.243 5-5 5-5-2.243-5-5z' fill='%23000'/%3E%3C/svg%3E"
					infoText={ priceAfter === priceBefore ? basicInfoText : onSaleInfoText }
					// eslint-disable-next-line react/jsx-no-bind
					onCtaClick={ sendToCart }
					priceAfter={ priceAfter }
					priceBefore={ priceBefore }
					currencyCode={ priceCurrencyCode }
					title={ __( 'Jetpack Search', 'jetpack-search-pkg' ) }
				/>
			</Col>
		</Container>
	);
};

const NewPricingComponent = ( { sendToCartPaid, sendToCartFree } ) => {
	const siteDomain = useSelect( select => select( STORE_ID ).getCalypsoSlug(), [] );

	const priceBefore = useSelect( select => select( STORE_ID ).getPriceBefore() / 12, [] );
	const priceAfter = useSelect( select => select( STORE_ID ).getPriceAfter() / 12, [] );
	const priceCurrencyCode = useSelect( select => select( STORE_ID ).getPriceCurrencyCode(), [] );
	const discountPercentage = useSelect(
		select => select( STORE_ID ).getPricingDiscountPercentage(),
		[]
	);
	const { hasConnectionError } = useConnectionErrorNotice();

	const paidRecordsLimitRaw = useSelect( select => select( STORE_ID ).getPaidRecordsLimit(), [] );
	const paidRecordsLimit = new Intl.NumberFormat( 'en-US', {
		notation: 'compact',
		compactDisplay: 'short',
	} ).format( paidRecordsLimitRaw );

	const paidRequestsLimitRaw = useSelect( select => select( STORE_ID ).getPaidRequestsLimit(), [] );
	const hasUnlimitedRequests = paidRequestsLimitRaw > 1e18;
	const unlimitedText = __( 'Unlimited', 'jetpack-search-pkg' );
	const paidRequestsLimit = hasUnlimitedRequests
		? unlimitedText
		: new Intl.NumberFormat( 'en-US', {
				notation: 'compact',
				compactDisplay: 'short',
		  } ).format( paidRequestsLimitRaw );

	const unitPrice = useSelect( select => select( STORE_ID ).getAdditionalUnitPrice(), [] );
	const unitQuantityRaw = useSelect( select => select( STORE_ID ).getAdditionalUnitQuantity(), [] );
	const unitQuantity = new Intl.NumberFormat( 'en-US', {
		notation: 'compact',
		compactDisplay: 'short',
	} ).format( unitQuantityRaw );

	return (
		<Container horizontalSpacing={ 8 }>
			{ hasConnectionError && (
				<Col lg={ 12 } md={ 12 } sm={ 12 }>
					<ConnectionError />
				</Col>
			) }

			<Col lg={ 12 } md={ 12 } sm={ 12 }>
				<ThemeProvider>
					<PricingTable { ...newPricingArgs }>
						<PricingTableColumn primary>
							<PricingTableHeader>
								<ProductPrice
									price={ priceBefore }
									offPrice={ discountPercentage > 0 ? priceAfter : null }
									currency={ priceCurrencyCode }
									legend=""
									promoLabel={
										discountPercentage > 0 &&
										sprintf(
											// translators: Discount percentage (e.g. 50%).
											__( '%s off', 'jetpack-search-pkg' ),
											`${ discountPercentage }%`
										)
									}
								>
									<div className="price-tip">
										<span className="price-tip-text">
											{ __( 'Starting price per month, billed yearly', 'jetpack-search-pkg' ) }
										</span>
										<IconTooltip
											placement={ 'bottom-end' }
											iconSize={ 14 }
											iconClassName="price-tip-icon"
											offset={ 4 }
										>
											{ createInterpolateElement(
												sprintf(
													// translators: %1$s: site domain
													__(
														'Starting price based on the number of records for <b>%1$s</b>.',
														'jetpack-search-pkg'
													),
													siteDomain
												),
												{ b: <b /> }
											) }{ ' ' }
											{ ! hasUnlimitedRequests &&
												createInterpolateElement(
													sprintf(
														// translators: %1$s: Records or requests count, <Price>: Additional charge.
														__(
															'For every additional %1$s records or requests, an additional <Price></Price> per month will be charged.',
															'jetpack-search-pkg'
														),
														unitQuantity
													),
													{
														Price: <Price amount={ unitPrice } currency={ priceCurrencyCode } />,
													}
												) }
										</IconTooltip>
									</div>
								</ProductPrice>
								<Button onClick={ sendToCartPaid } fullWidth>
									{ __( 'Get Search', 'jetpack-search-pkg' ) }
								</Button>
							</PricingTableHeader>
							<PricingTableItem
								isIncluded={ true }
								label={
									<strong>
										{ sprintf(
											// translators: %1$s: Number of records allowed before being charged extra.
											__( '%1$s records', 'jetpack-search-pkg' ),
											paidRecordsLimit
										) }
									</strong>
								}
							/>
							<PricingTableItem
								isIncluded={ true }
								label={
									<strong>
										{ sprintf(
											// translators: %1$s: Number of requests allowed before being charged extra.
											__( '%1$s requests', 'jetpack-search-pkg' ),
											paidRequestsLimit
										) }
									</strong>
								}
							/>
							<PricingTableItem
								isIncluded={ true }
								label={ __( 'Branding removed', 'jetpack-search-pkg' ) }
							/>
							<PricingTableItem isIncluded={ true } />
							<PricingTableItem isIncluded={ true } />
							<PricingTableItem isIncluded={ true } />
							<PricingTableItem isIncluded={ true } />
							<PricingTableItem isIncluded={ true } />
						</PricingTableColumn>
						<PricingTableColumn>
							<PricingTableHeader>
								<ProductPrice
									price={ 0 }
									legend=""
									currency={ priceCurrencyCode }
									hidePriceFraction
								/>
								<Button onClick={ sendToCartFree } variant="secondary" fullWidth>
									{ __( 'Start for free', 'jetpack-search-pkg' ) }
								</Button>
							</PricingTableHeader>
							<PricingTableItem
								isIncluded={ true }
								label={
									<strong>
										{
											// translators: Record count for calculating Jetpack Search tier
											__( '5k records', 'jetpack-search-pkg' )
										}
									</strong>
								}
								tooltipInfo={
									<>
										{ __(
											'In the free plan, you can continue using the plugin even if you have more than 5k records for three months.',
											'jetpack-search-pkg'
										) }{ ' ' }
										<a
											href="https://jetpack.com/search/"
											rel="external noopener noreferrer nofollow"
											target="_blank"
										>
											{ /* // translators: Text links to explanation of Jetpack Search billing tiers */ }
											{ __( 'More about indexing and query limits', 'jetpack-search-pkg' ) }
										</a>
									</>
								}
							/>
							<PricingTableItem
								isIncluded={ true }
								label={
									<strong>
										{
											// translators: Request count for calculating Jetpack Search tier
											__( '500 requests', 'jetpack-search-pkg' )
										}
									</strong>
								}
								tooltipInfo={
									<>
										{ __(
											'In the free plan, you can continue using the plugin even if you have more than 500 requests for three consecutive months.',
											'jetpack-search-pkg'
										) }{ ' ' }
										<a
											href="https://jetpack.com/search/"
											rel="external noopener noreferrer nofollow"
											target="_blank"
										>
											{ /* // translators: Text links to explanation of Jetpack Search billing tiers */ }
											{ __( 'More about indexing and query limits', 'jetpack-search-pkg' ) }
										</a>
									</>
								}
							/>
							<PricingTableItem
								isIncluded={ false }
								label={ __( 'Shows Jetpack logo', 'jetpack-search-pkg' ) }
							/>
							<PricingTableItem isIncluded={ false } />
							<PricingTableItem isIncluded={ true } />
							<PricingTableItem isIncluded={ true } />
							<PricingTableItem isIncluded={ true } />
							<PricingTableItem isIncluded={ true } />
						</PricingTableColumn>
					</PricingTable>
				</ThemeProvider>
			</Col>
		</Container>
	);
};

// For new pricing table
const newPricingArgs = {
	title: __( 'The best WordPress search experience', 'jetpack-search-pkg' ),
	items: [
		{
			name: __( 'Number of records', 'jetpack-search-pkg' ),
			tooltipInfo: __(
				'Records are all posts, pages, custom post types and other types of content indexed by Jetpack Search.',
				'jetpack-search-pkg'
			),
		},
		{
			name: __( 'Monthly requests', 'jetpack-search-pkg' ),
			tooltipInfo: __(
				'A search request is when someone visiting your site searches for something.',
				'jetpack-search-pkg'
			),
		},
		{
			name: __( 'Unbranded search', 'jetpack-search-pkg' ),
			tooltipInfo: __(
				'Paid customers can remove branding from the search tool.',
				'jetpack-search-pkg'
			),
		},
		{
			name: __( 'Priority support', 'jetpack-search-pkg' ),
			tooltipInfo: (
				<>
					{ __(
						'Paid customers get dedicated email support from our world-class Happiness Engineers to help with any issue.',
						'jetpack-search-pkg'
					) }
					<br />
					<br />
					{ __(
						'All other questions are handled by our team as quickly as we are able to through the WordPress support forum.',
						'jetpack-search-pkg'
					) }
				</>
			),
		},
		{
			name: __( 'Instant search and indexing', 'jetpack-search-pkg' ),
			tooltipInfo: (
				<>
					{ __( 'Instant search and filtering without reloading the page.', 'jetpack-search-pkg' ) }
					<br />
					<br />
					{ __(
						'Real-time indexing, so your search index will update within minutes of changes to your site.',
						'jetpack-search-pkg'
					) }
				</>
			),
		},
		{
			name: __( 'Powerful filtering', 'jetpack-search-pkg' ),
			tooltipInfo: __(
				'Filtered and faceted searches by tags, categories, dates, custom taxonomies, and post types.',
				'jetpack-search-pkg'
			),
		},
		{
			name: __( 'Supports 38 languages', 'jetpack-search-pkg' ),
			tooltipInfo: (
				<>
					{ __(
						'Language support for English, Spanish, French, Portuguese, Hindi, Japanese, among others.',
						'jetpack-search-pkg'
					) }{ ' ' }
					<a
						href="https://jetpack.com/support/search/jetpack-search-plugin/#faq"
						rel="external noopener noreferrer nofollow"
						target="_blank"
					>
						{ __( 'See all supported languanges', 'jetpack-search-pkg' ) }
					</a>
				</>
			),
		},
		{
			name: __( 'Spelling correction', 'jetpack-search-pkg' ),
			tooltipInfo: __(
				'Quick and accurate spelling correction for when your site visitors mistype their search.',
				'jetpack-search-pkg'
			),
		},
	],
};
