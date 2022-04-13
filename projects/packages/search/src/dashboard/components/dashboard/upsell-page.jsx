/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	AdminPage,
	Container,
	Col,
	getRedirectUrl,
	PricingCard,
} from '@automattic/jetpack-components';
import SearchPromotionBlock from './search-promotion';

/**
 * Internal dependencies
 */
import { STORE_ID } from 'store';

/**
 * defines UpsellPage.
 *
 * @returns {React.Component} UpsellPage component.
 */
export function UpsellPage() {
	const priceBefore = useSelect( select => select( STORE_ID ).getPriceBefore() / 12, [] );
	const priceAfter = useSelect( select => select( STORE_ID ).getPriceAfter() / 12, [] );
	const priceCurrencyCode = useSelect( select => select( STORE_ID ).getPriceCurrencyCode(), [] );
	const sendToCart = getRedirectUrl( 'jetpack-search' );

	const basicInfoText = __( '14 day money back guarantee.', 'jetpack-search-pkg' );
	const introductoryInfoText = __(
		'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
		'jetpack-search-pkg'
	);
	return (
		<AdminPage
			withHeader={ true }
			withFooter={ true }
			moduleName={ __( 'Jetpack Search', 'jetpack-search-pkg' ) }
			a8cLogoHref="https://www.jetpack.com"
		>
			<div id="jetpack-backup-admin-container" className="jp-content">
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col lg={ 6 } md={ 6 } sm={ 4 }>
						<SearchPromotionBlock />
					</Col>
					<Col lg={ 1 } md={ 1 } sm={ 0 } />
					<Col lg={ 5 } md={ 6 } sm={ 4 }>
						<PricingCard
							ctaText={ __( 'Get Jetpack Search', 'jetpack-search-pkg' ) }
							icon="data:image/svg+xml,%3Csvg width='32' height='32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='m21.092 15.164.019-1.703v-.039c0-1.975-1.803-3.866-4.4-3.866-2.17 0-3.828 1.351-4.274 2.943l-.426 1.524-1.581-.065a2.92 2.92 0 0 0-.12-.002c-1.586 0-2.977 1.344-2.977 3.133 0 1.787 1.388 3.13 2.973 3.133H22.399c1.194 0 2.267-1.016 2.267-2.4 0-1.235-.865-2.19-1.897-2.368l-1.677-.29Zm-10.58-3.204a4.944 4.944 0 0 0-.201-.004c-2.75 0-4.978 2.298-4.978 5.133s2.229 5.133 4.978 5.133h12.088c2.357 0 4.267-1.97 4.267-4.4 0-2.18-1.538-3.99-3.556-4.339v-.06c0-3.24-2.865-5.867-6.4-5.867-2.983 0-5.49 1.871-6.199 4.404Z' fill='%23000'/%3E%3C/svg%3E"
							infoText={ priceAfter === priceBefore ? basicInfoText : introductoryInfoText }
							// eslint-disable-next-line react/jsx-no-bind
							onCtaClick={ sendToCart }
							priceAfter={ priceAfter }
							priceBefore={ priceBefore }
							pricingCurrencyCode={ priceCurrencyCode }
							title={ __( 'Jetpack Search', 'jetpack-search-pkg' ) }
						/>
					</Col>
				</Container>
			</div>
		</AdminPage>
	);
}
