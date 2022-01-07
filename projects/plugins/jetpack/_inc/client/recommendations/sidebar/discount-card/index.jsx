/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import React, { useCallback } from 'react';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import { imagePath } from 'constants/urls';
import analytics from 'lib/analytics';

/**
 * Style dependencies
 */
import './style.scss';

const DiscountCard = () => {
	const onViewDiscountClick = useCallback( () => {
		analytics.tracks.recordJetpackClick(
			'jetpack_recommendations_view_discounted_plans_button_click'
		);
	}, [] );

	return (
		<div className="jp-recommendations-discount-card">
			<div className="jp-recommendations-discount-card__card-container">
				<div className="jp-recommendations-discount-card__card-header">
					<img
						src={ imagePath + 'recommendations/cloud-icon.png' }
						alt={ __( 'An icon representing the cloud.', 'jetpack' ) }
					/>
				</div>
				<div className="jp-recommendations-discount-card__card-body">
					<h3>{ __( 'Increase your site security!', 'jetpack' ) }</h3>
					<ul className="jp-recommendations-discount-card__feature-list">
						<li>{ __( 'Real-time cloud backups', 'jetpack' ) }</li>
						<li>{ __( 'One-click restores', 'jetpack' ) }</li>
						<li>{ __( 'Real-time malware scanning', 'jetpack' ) }</li>
						<li>{ __( 'Comments and form spam protection', 'jetpack' ) }</li>
					</ul>
					<Button
						className="jp-recommendations-discount-card__button"
						href="/product-suggestions"
						onClick={ onViewDiscountClick }
					>
						{ __( 'View discounted plans', 'jetpack' ) }
					</Button>
				</div>
			</div>
		</div>
	);
};

export default DiscountCard;
