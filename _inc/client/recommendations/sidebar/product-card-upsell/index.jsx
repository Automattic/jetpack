/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import { getCurrencyObject } from '@automattic/format-currency';

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
	const { upgradeUrl, upsell } = props;

	const {
		billing_timeframe,
		cost_timeframe,
		cta_text,
		currency_code,
		description,
		features,
		header,
		price,
		title,
	} = upsell;

	const currencyObject = getCurrencyObject( price, currency_code );

	return (
		<div className="jp-recommendations-product-card-upsell">
			<div className="jp-recommendations-product-card-upsell__header-chrome">
				<img src={ imagePath + '/star.svg' } alt="" />
				{ header }
			</div>
			<div className="jp-recommendations-product-card-upsell__padding">
				<h1>{ title }</h1>
				<p>{ description }</p>
				<div className="jp-recommendations-product-card-upsell__price">
					<span className="jp-recommendations-product-card-upsell__raw-price">
						<h2>
							<sup className="jp-recommendations-product-card-upsell__currency-symbol">
								{ currencyObject.symbol }
							</sup>
							<span className="jp-recommendations-product-card-upsell__price-integer">
								{ currencyObject.integer }
							</span>
							<sup className="jp-recommendations-product-card-upsell__price-fraction">
								{ currencyObject.fraction }
							</sup>
						</h2>
					</span>
					<span className="jp-recommendations-product-card-upsell__billing-time-frame">
						{ cost_timeframe }
						<br />
						{ billing_timeframe }
					</span>
				</div>
				<Button primary href={ upgradeUrl }>
					{ cta_text }
					<Gridicon icon="external" />
				</Button>
				<ul className="jp-recommendations-sidebar-card__features">
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
	upgradeUrl: PropTypes.string.isRequired,
	features: PropTypes.arrayOf( PropTypes.string ),
};

export { ProductCardUpsell };
