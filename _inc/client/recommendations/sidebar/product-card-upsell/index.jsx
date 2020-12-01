/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import { imagePath } from 'constants/urls';

/**
 * Style dependencies
 */
import './style.scss';

const ProductCardUpsell = props => {
	const { title, description, ctaHref, features } = props;

	// TODO: get price etc dynamically from API.
	return (
		<div className="jp-recommendations-product-card-upsell">
			<div className="jp-recommendations-product-card-upsell__header-chrome">
				<img src={ imagePath + '/star.svg' } alt="" />
				{ __( 'Recommended premium product' ) }
			</div>
			<div className="jp-recommendations-product-card-upsell__padding">
				<h1>{ title }</h1>
				<p>{ description }</p>
				<div className="jp-recommendations-product-card-upsell__price">
					<span className="jp-recommendations-product-card-upsell__raw-price">
						<h2>
							<sup className="jp-recommendations-product-card-upsell__currency-symbol">$</sup>
							<span className="jp-recommendations-product-card-upsell__price-integer">7</span>
							<sup className="jp-recommendations-product-card-upsell__price-fraction">.95</sup>
						</h2>
					</span>
					<span className="jp-recommendations-product-card-upsell__billing-time-frame">
						{ __( 'per month' ) }
						<br />
						{ __( 'billed yearly' ) }
					</span>
				</div>
				<Button primary href={ ctaHref }>
					{ __( 'Learn more' ) }
					<Gridicon icon="external" />
				</Button>
				<ul className="jp-recommendations-product-card-upsell__features">
					{ features.map( feature => (
						<li>
							<Gridicon icon="checkmark-circle" />
							{ feature }
						</li>
					) ) }
				</ul>
			</div>
		</div>
	);
};

ProductCardUpsell.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	ctaHref: PropTypes.string.isRequired,
	features: PropTypes.arrayOf( PropTypes.string ),
};

export { ProductCardUpsell };
