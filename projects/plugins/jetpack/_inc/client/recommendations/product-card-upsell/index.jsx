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
import analytics from 'lib/analytics';
import RecommendedHeader from '../sidebar/recommended-header';

/**
 * Style dependencies
 */
import './style.scss';
import classNames from 'classnames';

const ProductCardUpsell = ( {
	billing_timeframe,
	cost_timeframe,
	currency_code,
	description,
	features,
	price,
	isRecommended,
	product_slug,
	title,
	upgradeUrl,
	onClick,
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
	const header = isRecommended && (
		<RecommendedHeader className="jp-recommendations-product-card-upsell__header" />
	);

	return (
		<div
			className={ classNames( 'jp-recommendations-product-card-upsell', {
				'with-header': !! header,
			} ) }
		>
			{ header }
			<h1 className="jp-recommendations-product-card-upsell__heading">{ title }</h1>
			<p className="jp-recommendations-product-card-upsell__description">{ description }</p>
			<ul className="jp-recommendations-product-card-upsell__features jp-recommendations-sidebar-card__features">
				{ features.map( feature => (
					<li key={ feature }>{ feature }</li>
				) ) }
			</ul>
			<div className="jp-recommendations-product-card-upsell__price">
				<div className="jp-recommendations-product-card-upsell__raw-price">
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
				</div>
				<div className="jp-recommendations-product-card-upsell__billing-time-frame">
					{ `${ cost_timeframe }, ${ billing_timeframe }` }
				</div>
			</div>
			<Button
				className="jp-recommendations-product-card-upsell__cta-button"
				primary={ ! isRecommended }
				rna
				href={ upgradeUrl }
				onClick={ onClick || onUpsellClick }
				target="_blank"
				rel="noopener noreferrer"
			>
				{
					/* translators: %s: Jetpack product name. */
					sprintf( __( 'Continue with %s', 'jetpack' ), title )
				}
			</Button>
		</div>
	);
};

ProductCardUpsell.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	upgradeUrl: PropTypes.string.isRequired,
	features: PropTypes.arrayOf( PropTypes.string ),
	onClick: PropTypes.func,
};

export { ProductCardUpsell };
