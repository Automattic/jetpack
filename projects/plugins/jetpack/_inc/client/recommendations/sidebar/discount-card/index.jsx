/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import { imagePath } from 'constants/urls';
import analytics from 'lib/analytics';
import Timer from '../../timer';
import { getProductCardData, getProductCardDataStepOverrides } from 'recommendations/feature-utils';

/**
 * Style dependencies
 */
import './style.scss';

const DiscountCardComponent = props => {
	const {
		discount,
		expiryDate,
		productCardTitle,
		productCardCtaLink,
		productCardCtaText,
		productCardList,
		productCardIcon,
		stepSlug,
	} = props;

	const onViewDiscountClick = useCallback( () => {
		analytics.tracks.recordJetpackClick(
			'jetpack_recommendations_view_discounted_plans_button_click',
			{
				feature: stepSlug,
			}
		);
	}, [ stepSlug ] );

	const onProductCtaClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( 'jetpack_recommendations_step_product_card_button_click', {
			feature: stepSlug,
		} );
	}, [ stepSlug ] );

	return (
		<div className="jp-recommendations-discount-card">
			<div className="jp-recommendations-discount-card__container">
				<div className="jp-recommendations-discount-card__card">
					<div className="jp-recommendations-discount-card__card-header">
						<img
							className="jp-recommendations-discount-card__header-icon"
							src={ imagePath + productCardIcon }
							alt=""
						/>
						{ discount && (
							<div className="jp-recommendations-discount-card__discount">
								{ /* eslint-disable */ }
								{ sprintf(
									// translators: %d is the percentage value, %% the percentage symbol
									__( '%d%% off', 'jetpack' ), // @wordpress/valid-sprintf doesn't understand that the % symbol must be escaped
									discount
								) }
								{ /* eslint-enable */ }
							</div>
						) }
					</div>
					<div className="jp-recommendations-discount-card__card-body">
						<h3 className="jp-recommendations-discount-card__heading">{ productCardTitle }</h3>
						{ productCardList && (
							<ul className="jp-recommendations-discount-card__feature-list">
								{ productCardList.map( listItem => {
									return <li>{ listItem }</li>;
								} ) }
							</ul>
						) }
						{ discount ? (
							<Button
								className="jp-recommendations-discount-card__button"
								rna
								href={ '#/recommendations/product-suggestions' }
								onClick={ onViewDiscountClick }
							>
								{ __( 'View discounted products', 'jetpack' ) }
							</Button>
						) : (
							<Button
								className="jp-recommendations-discount-card__button"
								rna
								href={ productCardCtaLink }
								onClick={ onProductCtaClick }
							>
								{ productCardCtaText }
							</Button>
						) }
					</div>
				</div>
				{ discount && expiryDate && (
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

DiscountCardComponent.PropTypes = {
	productSlug: PropTypes.string.isRequired,
};

const DiscountCard = connect( ( state, ownProps ) => {
	return {
		...getProductCardData( state, ownProps.productSlug ),
		...getProductCardDataStepOverrides( state, ownProps.productSlug, ownProps.stepSlug ),
	};
} )( DiscountCardComponent );

export { DiscountCard };
