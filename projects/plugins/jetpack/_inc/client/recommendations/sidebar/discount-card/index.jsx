/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import { imagePath } from 'constants/urls';
import analytics from 'lib/analytics';
import { isFetchingSiteDiscount, getSiteDiscount } from 'state/site/reducer';
import DiscountBadge from '../../discount-badge';
import Timer from '../../timer';

/**
 * Style dependencies
 */
import './style.scss';

const DiscountCard = ( { isLoadingDiscount, discountData } ) => {
	const expiryDate = discountData?.expiry_date;
	const discount = discountData?.discount;

	const onViewDiscountClick = useCallback( () => {
		analytics.tracks.recordJetpackClick(
			'jetpack_recommendations_view_discounted_plans_button_click'
		);
	}, [] );

	// TODO: compute discount

	return (
		<div className="jp-recommendations-discount-card">
			<div className="jp-recommendations-discount-card__container">
				{ ! isLoadingDiscount && (
					<div className="jp-recommendations-discount-card__card">
						<div className="jp-recommendations-discount-card__card-header">
							<img
								className="jp-recommendations-discount-card__header-icon"
								src={ imagePath + 'recommendations/cloud-icon.svg' }
								alt=""
							/>
							{ discount && <DiscountBadge discount={ discount } /> }
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
							<Button
								className="jp-recommendations-discount-card__button"
								rna
								href={ '#/recommendations/product-suggestions' }
								onClick={ onViewDiscountClick }
							>
								{ discount
									? __( 'View discounted plans', 'jetpack' )
									: __( 'View plans', 'jetpack' ) }
							</Button>
						</div>
					</div>
				) }
				{ expiryDate && (
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
	isLoadingDiscount: isFetchingSiteDiscount( state ),
	discountData: getSiteDiscount( state ),
} ) )( DiscountCard );
