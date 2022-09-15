import {
	AdminPage,
	Container,
	Col,
	PricingCard,
	AdminSectionHero,
} from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import Loading from 'components/loading';
import SearchPromotionBlock from 'components/search-promotion';
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

	const priceBefore = useSelect( select => select( STORE_ID ).getPriceBefore() / 12, [] );
	const priceAfter = useSelect( select => select( STORE_ID ).getPriceAfter() / 12, [] );
	const priceCurrencyCode = useSelect( select => select( STORE_ID ).getPriceCurrencyCode(), [] );
	const domain = useSelect( select => select( STORE_ID ).getCalypsoSlug(), [] );
	const adminUrl = useSelect( select => select( STORE_ID ).getSiteAdminUrl(), [] );

	const sendToCart = useCallback( () => {
		window.location.href = getProductCheckoutUrl( {
			siteSuffix: domain,
			redirectUrl: `${ adminUrl }admin.php?page=jetpack-search`,
			isUserConnected: isFullyConnected,
		} );
	}, [ domain, adminUrl, isFullyConnected ] );

	const basicInfoText = __( '14 day money back guarantee.', 'jetpack-search-pkg' );
	const onSaleInfoText = __(
		'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
		'jetpack-search-pkg'
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
							<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
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
						</AdminSectionHero>
					</AdminPage>
				</div>
			) }
		</>
	);
}
