import { __ } from '@wordpress/i18n';
import { MoneyBackGuarantee } from 'components/money-back-guarantee';
import analytics from 'lib/analytics';
import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import { getUpsell } from 'state/recommendations';
import { getSiteDiscount } from 'state/site/reducer';
import { ProductCardUpsell } from '../product-card-upsell';
import Timer from '../timer';
import { isCouponValid } from '../utils';

import './style.scss';

const SummaryUpsellComponent = ( { upsell, discountData } ) => {
	const { product_slug: productSlug } = upsell || {};
	const { expiry_date: expiryDate } = discountData;

	const hasDiscount = useMemo( () => isCouponValid( discountData ), [ discountData ] );

	const onUpsellClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_click', {
			product_slug: productSlug,
			discount: hasDiscount,
		} );
	}, [ productSlug, hasDiscount ] );
	const onUpsellMount = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_display', {
			product_slug: productSlug,
			discount: hasDiscount,
		} );
	}, [ productSlug, hasDiscount ] );

	return (
		<>
			<ProductCardUpsell
				{ ...upsell }
				slug={ productSlug }
				isRecommended
				onClick={ onUpsellClick }
				onMount={ onUpsellMount }
			/>
			{ hasDiscount && (
				<div className="jp-recommendations-summary__discount">
					<div className="jp-recommendations-summary__timer">
						<Timer
							timeClassName="jp-recommendations-summary__time"
							label={ __( 'Discount ends in:', 'jetpack' ) }
							expiryDate={ expiryDate }
						/>
					</div>
					<a
						className="jp-recommendations-summary__reco-link"
						href="#/recommendations/product-suggestions"
					>
						{ __( 'See all discounted products', 'jetpack' ) }
					</a>
				</div>
			) }
			<div className="jp-recommendations-summary__footer">
				<MoneyBackGuarantee text={ __( '14-day money-back guarantee', 'jetpack' ) } />
				<div className="jp-recommendations-summary__footnote">
					{ hasDiscount &&
						__( '* Discount is for first term only, all renewals are at full price.', 'jetpack' ) }
					{ ! hasDiscount &&
						__( 'Special introductory pricing, all renewals are at full price.', 'jetpack' ) }
				</div>
			</div>
		</>
	);
};

const SummaryUpsell = connect( state => ( {
	upsell: getUpsell( state ),
	discountData: getSiteDiscount( state ),
} ) )( SummaryUpsellComponent );

export default SummaryUpsell;
