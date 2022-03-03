/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { useCallback, useEffect } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { getCurrencyObject } from '@automattic/format-currency';

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

const ProductCardUpsell = ( {
	billing_timeframe,
	cost_timeframe,
	currency_code,
	description,
	features,
	header,
	price,
	product_slug,
	title,
	upgradeUrl,
} ) => {
	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_display', {
			type: 'upsell_with_price',
			product_slug,
		} );
	}, [ product_slug ] );

	const onUpsellClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_click', {
			type: 'upsell_with_price',
			product_slug,
		} );
	}, [ product_slug ] );

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
				<Button
					className="jp-recommendations-product-card-upsell__cta-button"
					primary
					href={ upgradeUrl }
					onClick={ onUpsellClick }
					target="_blank"
					rel="noopener noreferrer"
				>
					{
						/* translators: %s: Jetpack product name. */
						sprintf( __( 'Continue with %s', 'jetpack' ), title )
					}
				</Button>
				<ul className="jp-recommendations-sidebar-card__features">
					{ features.map( feature => (
						<li key={ feature }>{ feature }</li>
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
