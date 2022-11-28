import { imagePath } from 'constants/urls';
import { ExternalLink } from '@wordpress/components';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { getProductCardData, getProductCardDataStepOverrides } from 'recommendations/feature-utils';

// Styles for this component are the same as the discount card
import '../discount-card/style.scss';

const ProductSpotlightComponent = props => {
	const {
		productCardTitle,
		productCardCtaLink,
		productCardCtaText,
		productCardList,
		productCardIcon,
		productCardDisclaimer,
		stepSlug,
	} = props;

	const onProductCtaClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_step_product_card_button_click', {
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
					</div>
					<div className="jp-recommendations-discount-card__card-body">
						<h3 className="jp-recommendations-discount-card__heading">{ productCardTitle }</h3>
						{ productCardList && (
							<ul className="jp-recommendations-discount-card__feature-list">
								{ productCardList.map( ( listItem, index ) => {
									return <li key={ `feature-${ index }` }>{ listItem }</li>;
								} ) }
							</ul>
						) }
						{ productCardDisclaimer && (
							<p className="jp-recommendations-discount-card__disclaimer">
								{ productCardDisclaimer.text }{ ' ' }
								<ExternalLink href={ productCardDisclaimer.url }>
									{ productCardDisclaimer.link_text }
								</ExternalLink>
							</p>
						) }
						<ExternalLink
							type="button"
							className="dops-button is-rna jp-recommendations-discount-card__button"
							href={ productCardCtaLink }
							onClick={ onProductCtaClick }
						>
							{ productCardCtaText }
						</ExternalLink>
					</div>
				</div>
			</div>
		</div>
	);
};

ProductSpotlightComponent.propTypes = {
	productSlug: PropTypes.string.isRequired,
};

const ProductSpotlight = connect( ( state, ownProps ) => {
	return {
		...getProductCardData( state, ownProps.productSlug ),
		...getProductCardDataStepOverrides( state, ownProps.productSlug, ownProps.stepSlug ),
	};
} )( ProductSpotlightComponent );

export { ProductSpotlight };
