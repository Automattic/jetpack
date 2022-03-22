/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback } from 'react';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import { imagePath } from 'constants/urls';
import analytics from 'lib/analytics';
import Timer from '../../timer';

/**
 * Style dependencies
 */
import './style.scss';

const DiscountCard = ( { discount, expiryDate } ) => {
	const onViewDiscountClick = useCallback( () => {
		analytics.tracks.recordJetpackClick(
			'jetpack_recommendations_view_discounted_plans_button_click'
		);
	}, [] );

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
						<div className="jp-recommendations-discount-card__discount">
							{ /* eslint-disable */ }
							{ sprintf(
								// translators: %d is the percentage value, %% the percentage symbol
								__( '%d%% off', 'jetpack' ), // @wordpress/valid-sprintf doesn't understand that the % symbol must be escaped
								discount
							) }
							{ /* eslint-enable */ }
						</div>
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
							{ __( 'View discounted plans', 'jetpack' ) }
						</Button>
					</div>
				</div>
				<div className="jp-recommendations-discount-card__timer">
					{ __( 'Discounts ends in:', 'jetpack' ) }
					<Timer className="jp-recommendations-discount-card__time" expiryDate={ expiryDate } />
				</div>
			</div>
		</div>
	);
};

export default DiscountCard;
