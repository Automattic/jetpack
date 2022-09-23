import {
	AdminPage,
	Container,
	Col,
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
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import Loading from 'components/loading';
import useConnection from 'hooks/use-connection';
import React, { useCallback } from 'react';
import { STORE_ID } from 'store';
import getProductCheckoutUrl from 'utils/get-product-checkout-url';

import './upsell-page.scss';

const AUTOMATTIC_WEBSITE = 'https://automattic.com/';

/**
 * defines UpsellPage.
 *
 * @param {object} props - Component properties.
 * @param {string} props.isLoading - should page show Loading spinner.
 * @returns {React.Component} UpsellPage component.
 */
export default function UpsellPage( { isLoading = false } ) {
	useSelect( select => select( STORE_ID ).getSearchPricing(), [] );
	const { isFullyConnected } = useConnection();

	const isPageLoading = useSelect(
		select =>
			select( STORE_ID ).isResolving( 'getSearchPricing' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchPricing' ) ||
			isLoading,
		[ isLoading ]
	);

	const domain = useSelect( select => select( STORE_ID ).getCalypsoSlug(), [] );
	const adminUrl = useSelect( select => select( STORE_ID ).getSiteAdminUrl(), [] );
	const siteDomain = useSelect( select => select( STORE_ID ).getCalypsoSlug(), [] );

	const sendToCart = useCallback( () => {
		window.location.href = getProductCheckoutUrl( {
			siteSuffix: domain,
			redirectUrl: `${ adminUrl }admin.php?page=jetpack-search`,
			isUserConnected: isFullyConnected,
		} );
	}, [ domain, adminUrl, isFullyConnected ] );

	const pricingArgs = {
		title: 'The best WordPress search experience',
		items: [
			{
				name: 'Number of records',
				tooltipInfo: (
					<>
						Records are all posts, pages, custom post types and other types of content indexed by
						Jetpack Search.
					</>
				),
			},
			{
				name: 'Monthly requests',
				tooltipInfo: (
					<>A search request is when someone visiting your site searches for something.</>
				),
			},
			{
				name: 'Unbranded search',
				tooltipInfo: <>Paid customers can remove branding from the search tool.</>,
			},
			{
				name: 'Priority support',
				tooltipInfo: (
					<>
						Paid customers get dedicated email support from our world-class Happiness Engineers to
						help with any issue.
						<br />
						<br />
						All other questions are handled by our team as quickly as we are able to through the
						WordPress support forum.
					</>
				),
			},
			{
				name: 'Instant search and indexing',
				tooltipInfo: (
					<>
						Instant search and filtering without reloading the page.
						<br />
						<br />
						Real-time indexing, so your search index will update within minutes of changes to your
						site.
					</>
				),
			},
			{
				name: 'Powerful filtering',
				tooltipInfo: (
					<>
						Filtered and faceted searches by tags, categories, dates, custom taxonomies, and post
						types.
					</>
				),
			},
			{
				name: 'Supports 38 languages',
				tooltipInfo: (
					<>
						Language support for English, Spanish, French, Portuguese, Hindi, Japanese, among
						others.{ ' ' }
						<a href="#" rel="external noopener noreferrer nofollow" target="_blank">
							See all supported languanges
						</a>
					</>
				),
			},
			{
				name: 'Spelling correction',
				tooltipInfo: (
					<>
						Quick and accurate spelling correction for when your site visitors mistype their search.
					</>
				),
			},
		],
	};

	const pricingTable = (
		<PricingTable { ...pricingArgs }>
			<PricingTableColumn primary>
				<PricingTableHeader>
					<ProductPrice
						price={ 9.95 }
						offPrice={ 4.97 }
						currency="USD"
						leyend=""
						promoLabel="50% off"
					>
						<div className="price-tip">
							<span className="price-tip-text">Starting price per month, billed yearly</span>
							<IconTooltip
								placement={ 'bottom-end' }
								iconSize={ 14 }
								iconClassName="price-tip-icon"
								offset={ 4 }
							>
								<>
									Starting price based on the number of records for <b>{ siteDomain }</b>. For every
									additional 10k records or requests, an additional $7.50 per month will be charged.
								</>
							</IconTooltip>
						</div>
					</ProductPrice>
					<Button onClick={ sendToCart } fullWidth>
						{ __( 'Get Search', 'jetpack-search-pkg' ) }
					</Button>
				</PricingTableHeader>
				<PricingTableItem isIncluded={ true } label={ <strong>10k records</strong> } />
				<PricingTableItem isIncluded={ true } label={ '10k requests' } />
				<PricingTableItem isIncluded={ true } label="Branding removed" />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
			</PricingTableColumn>
			<PricingTableColumn>
				<PricingTableHeader>
					<ProductPrice price={ 0 } leyend="Free forever" currency="USD" hidePriceFraction />
					<Button onClick={ sendToCart } variant="secondary" fullWidth>
						{ __( 'Start for free', 'jetpack-search-pkg' ) }
					</Button>
				</PricingTableHeader>
				<PricingTableItem
					isIncluded={ true }
					label="5k records"
					tooltipInfo={
						<>
							In the free plan, you can continue using the plugin even if you have more than 5k
							records for three months.{ ' ' }
							<a
								href="https://jetpack.com/search/"
								rel="external noopener noreferrer nofollow"
								target="_blank"
							>
								More about indexing and query limits
							</a>
						</>
					}
				/>
				<PricingTableItem
					isIncluded={ true }
					label="500 requests"
					tooltipInfo={
						<>
							In the free plan, you can continue using the plugin even if you have more than 500
							requests for three consecutive months.{ ' ' }
							<a
								href="https://jetpack.com/search/"
								rel="external noopener noreferrer nofollow"
								target="_blank"
							>
								More about indexing and query limits
							</a>
						</>
					}
				/>
				<PricingTableItem isIncluded={ false } label="Shows Jetpack logo" />
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
			</PricingTableColumn>
		</PricingTable>
	);

	return (
		<>
			{ isPageLoading && <Loading /> }
			{ ! isPageLoading && (
				<div className="jp-search-dashboard-upsell-page">
					<AdminPage
						withHeader={ true }
						withFooter={ true }
						moduleName={ __( 'Jetpack Search', 'jetpack-search-pkg' ) }
						a8cLogoHref={ AUTOMATTIC_WEBSITE }
					>
						<AdminSectionHero>
							<Container horizontalSpacing={ 8 }>
								<Col lg={ 12 } md={ 12 } sm={ 12 }>
									<ThemeProvider>{ pricingTable }</ThemeProvider>
								</Col>
							</Container>
						</AdminSectionHero>
					</AdminPage>
				</div>
			) }
		</>
	);
}
