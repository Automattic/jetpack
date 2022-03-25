/**
 * External dependencies
 */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { getCurrencyObject } from '@automattic/format-currency';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import { isFetchingSiteDiscount, getSiteDiscount } from 'state/site/reducer';
import DiscountBadge from '../discount-badge';
import RecommendedHeader from '../sidebar/recommended-header';

/**
 * Style dependencies
 */
import './style.scss';

const Price = ( { className, integer, fraction, symbol } ) => (
	<div className={ className }>
		<sup className="jp-recommendations-product-card-upsell__currency-symbol">{ symbol }</sup>
		<span className="jp-recommendations-product-card-upsell__price-integer">{ integer }</span>
		<sup className="jp-recommendations-product-card-upsell__price-fraction">{ fraction }</sup>
	</div>
);

const ProductCardUpsellComponent = ( {
	title,
	description,
	billing_timeframe,
	cost_timeframe,
	currency_code,
	upgradeUrl,
	price,
	isRecommended,
	features,
	onClick,
	onMount,
	isLoadingDiscount,
	discountData,
} ) => {
	const { discount } = discountData || {};
	const rawPrice = ( price * 12 ) / 0.4 / 12; // TODO: get from API
	const finalPrice = discount ? price * ( 1 - discount / 100 ) : price;
	const totalDiscount = ( ( rawPrice - finalPrice ) / rawPrice ) * 100;
	const rawCurrencyObject = getCurrencyObject( rawPrice, currency_code );
	const currencyObject = getCurrencyObject( finalPrice, currency_code );

	const header = isRecommended && (
		<RecommendedHeader className="jp-recommendations-product-card-upsell__header" />
	);

	useEffect( () => {
		if ( onMount ) {
			onMount();
		}
	}, [ onMount ] );

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
			{ ! isLoadingDiscount && (
				<>
					<div className="jp-recommendations-product-card-upsell__price-container">
						<div className="jp-recommendations-product-card-upsell__price">
							{ discount && (
								<Price
									className="jp-recommendations-product-card-upsell__raw-price"
									{ ...rawCurrencyObject }
								/>
							) }
							<Price
								className="jp-recommendations-product-card-upsell__final-price"
								{ ...currencyObject }
							/>
							{ discount && (
								<DiscountBadge
									className="jp-recommendations-product-card-upsell__discount"
									discount={ totalDiscount }
									suffix="*"
								/>
							) }
						</div>
						<div className="jp-recommendations-product-card-upsell__billing-time-frame">
							{ `${ cost_timeframe }, ${ billing_timeframe }` }
						</div>
					</div>
				</>
			) }
			<Button
				className="jp-recommendations-product-card-upsell__cta-button"
				primary={ ! isRecommended }
				rna
				href={ upgradeUrl }
				onClick={ onClick }
				target="_blank"
				rel="noopener noreferrer"
			>
				{
					/* translators: %s: Jetpack product name. */
					sprintf( __( 'Get %s', 'jetpack' ), title )
				}
			</Button>
		</div>
	);
};

ProductCardUpsellComponent.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	billing_timeframe: PropTypes.string.isRequired,
	cost_timeframe: PropTypes.string.isRequired,
	currency_code: PropTypes.string.isRequired,
	upgradeUrl: PropTypes.string.isRequired,
	features: PropTypes.arrayOf( PropTypes.string ).isRequired,
	price: PropTypes.number.isRequired,
	isRecommended: PropTypes.bool,
	onClick: PropTypes.func,
	onMount: PropTypes.func,
};

const ProductCardUpsell = connect( state => ( {
	isLoadingDiscount: isFetchingSiteDiscount( state ),
	discountData: getSiteDiscount( state ),
} ) )( ProductCardUpsellComponent );

export { ProductCardUpsell };
