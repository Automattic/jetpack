import { imagePath } from 'constants/urls';
import { __ } from '@wordpress/i18n';
import Button from 'components/button';
import analytics from 'lib/analytics';
import React, { useCallback, useMemo, useEffect } from 'react';
import { connect } from 'react-redux';
import { getIntroOffers, isFetchingIntroOffers } from 'state/intro-offers';
import {
	getProductSuggestions,
	getStep,
	isFetchingRecommendationsProductSuggestions,
	markSiteDiscountAsViewedInRecommendations,
} from 'state/recommendations';
import { isFetchingSiteDiscount, getSiteDiscount } from 'state/site/reducer';
import DiscountBadge from '../../discount-badge';
import Timer from '../../timer';
import { computeMaxSuggestedDiscount, isCouponValid } from '../../utils';

import './style.scss';

const DiscountCard = ( {
	isLoading,
	discountData,
	introOffers,
	suggestions,
	markAsViewed,
	step,
} ) => {
	const { expiry_date: expiryDate } = discountData;

	const discount = useMemo(
		() => computeMaxSuggestedDiscount( discountData, introOffers, suggestions ),
		[ discountData, introOffers, suggestions ]
	);
	const hasDiscount = useMemo( () => isCouponValid( discountData ), [ discountData ] );

	const onCtaClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_upsell_card_cta_click', {
			discount: hasDiscount,
		} );
	}, [ hasDiscount ] );

	useEffect( () => markAsViewed( step ), [ markAsViewed, step ] );

	useEffect( () => {
		if ( ! isLoading ) {
			analytics.tracks.recordEvent( 'jetpack_recommendations_upsell_card_display', {
				discount: hasDiscount,
			} );
		}
	}, [ isLoading, hasDiscount ] );

	if ( isLoading ) {
		return null;
	}

	return (
		<div className="jp-recommendations-discount-card">
			<div className="jp-recommendations-discount-card__container">
				<div className="jp-recommendations-discount-card__card">
					<div className="jp-recommendations-discount-card__card-header">
						<img
							className="jp-recommendations-discount-card__header-icon"
							src={ imagePath + 'recommendations/cloud-icon.svg' }
							alt=""
						/>
						{ hasDiscount && <DiscountBadge discount={ discount } /> }
					</div>
					<div className="jp-recommendations-discount-card__card-body">
						<h3 className="jp-recommendations-discount-card__heading">
							{ __( 'Increase your site security!', 'jetpack' ) }
						</h3>
						<ul className="jp-recommendations-discount-card__feature-list">
							<li>{ __( 'Real-time cloud backups', 'jetpack' ) }</li>
							<li>{ __( 'One-click restores', 'jetpack' ) }</li>
							<li>{ __( 'Real-time malware scanning', 'jetpack' ) }</li>
							<li>{ __( 'Comments and form spam protection', 'jetpack' ) }</li>
						</ul>
						{ ! isLoading && (
							<Button
								className="jp-recommendations-discount-card__button"
								rna
								href={ '#/recommendations/product-suggestions' }
								onClick={ onCtaClick }
							>
								{ hasDiscount && __( 'View discounted products', 'jetpack' ) }
								{ ! hasDiscount && __( 'View products', 'jetpack' ) }
							</Button>
						) }
					</div>
				</div>
				{ hasDiscount && (
					<div className="jp-recommendations-discount-card__timer">
						<Timer
							timeClassName="jp-recommendations-discount-card__time"
							label={ __( 'Discount ends in:', 'jetpack' ) }
							expiryDate={ expiryDate }
						/>
					</div>
				) }
			</div>
		</div>
	);
};

export default connect(
	state => ( {
		isLoading:
			isFetchingSiteDiscount( state ) ||
			isFetchingRecommendationsProductSuggestions( state ) ||
			isFetchingIntroOffers( state ),
		discountData: getSiteDiscount( state ),
		introOffers: getIntroOffers( state ),
		suggestions: getProductSuggestions( state ),
		step: getStep( state ),
	} ),
	dispatch => ( {
		markAsViewed: step => dispatch( markSiteDiscountAsViewedInRecommendations( step ) ),
	} )
)( DiscountCard );
