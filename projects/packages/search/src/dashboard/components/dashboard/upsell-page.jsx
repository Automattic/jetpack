/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	AdminPage,
	Container,
	Col,
	getRedirectUrl,
	PricingCard,
	AdminSectionHero,
} from '@automattic/jetpack-components';
import SearchPromotionBlock from './search-promotion';

/**
 * Internal dependencies
 */
import { STORE_ID } from 'store';
import './upsell-page.scss';

/**
 * defines UpsellPage.
 *
 * @returns {React.Component} UpsellPage component.
 */
export function UpsellPage() {
	const priceBefore = useSelect( select => select( STORE_ID ).getPriceBefore() / 12, [] );
	const priceAfter = useSelect( select => select( STORE_ID ).getPriceAfter() / 12, [] );
	const priceCurrencyCode = useSelect( select => select( STORE_ID ).getPriceCurrencyCode(), [] );
	const domain = useSelect( select => select( STORE_ID ).getCalypsoSlug(), [] );

	const sendToCart = useCallback( () => {
		window.location.href = getRedirectUrl( 'jetpack-search', { site: domain } );
	}, [ domain ] );

	const basicInfoText = __( '14 day money back guarantee.', 'jetpack-search-pkg' );
	const onSaleInfoText = __(
		'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
		'jetpack-search-pkg'
	);

	return (
		<div className="jp-search-dashboard-upsell-page">
			<AdminPage
				withHeader={ true }
				withFooter={ true }
				moduleName={ __( 'Jetpack Search', 'jetpack-search-pkg' ) }
				a8cLogoHref="https://www.jetpack.com"
			>
				<AdminSectionHero>
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col lg={ 6 } md={ 6 } sm={ 4 }>
							<h1>The best WordPress search experience</h1>
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
								pricingCurrencyCode={ priceCurrencyCode }
								title={ __( 'Jetpack Search', 'jetpack-search-pkg' ) }
							/>
						</Col>
					</Container>
				</AdminSectionHero>
			</AdminPage>
		</div>
	);
}
