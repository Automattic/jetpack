/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import { imagePath } from 'constants/urls';
import analytics from 'lib/analytics';
import { getIntroOffers, isFetchingIntroOffers } from 'state/intro-offers';
import {
	getProductSuggestions,
	isFetchingRecommendationsProductSuggestions,
} from 'state/recommendations';
import { isFetchingSiteDiscount, getSiteDiscount } from 'state/site/reducer';
import DiscountBadge from '../../discount-badge';
import Timer from '../../timer';
import { computeMaxSuggestedDiscount } from '../../utils';

/**
 * Style dependencies
 */
import './style.scss';

const DiscountCard = ( {
	isFetchingDiscount,
	isFetchingSuggestions,
	isFetchingOffers,
	discountData,
	introOffers,
	suggestions,
} ) => {
	const { expiry_date: expiryDate, is_used: isUsed } = discountData;
	const discount = useMemo(
		() => computeMaxSuggestedDiscount( discountData, introOffers, suggestions ),
		[ discountData, introOffers, suggestions ]
	);
	const onViewDiscountClick = useCallback( () => {
		analytics.tracks.recordJetpackClick(
			'jetpack_recommendations_view_discounted_plans_button_click'
		);
	}, [] );
	const hasDiscount = useMemo(
		() => discount && ! isUsed && new Date( expiryDate ).valueOf() - Date.now() > 0,
		[ discount, isUsed, expiryDate ]
	);

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
						{ ! ( isFetchingDiscount || isFetchingSuggestions || isFetchingOffers ) && (
							<Button
								className="jp-recommendations-discount-card__button"
								rna
								href={ '#/recommendations/product-suggestions' }
								onClick={ onViewDiscountClick }
							>
								{ hasDiscount
									? __( 'View discounted products', 'jetpack' )
									: __( 'View products', 'jetpack' ) }
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

export default connect( state => ( {
	isFetchingDiscount: isFetchingSiteDiscount( state ),
	isFetchingSuggestions: isFetchingRecommendationsProductSuggestions( state ),
	isFetchingOffers: isFetchingIntroOffers( state ),
	discountData: getSiteDiscount( state ),
	introOffers: getIntroOffers( state ),
	suggestions: getProductSuggestions( state ),
} ) )( DiscountCard );
