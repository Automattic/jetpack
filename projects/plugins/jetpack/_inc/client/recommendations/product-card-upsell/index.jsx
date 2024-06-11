import { getCurrencyObject } from '@automattic/format-currency';
import { isFirstMonthTrial } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import Button from 'components/button';
import PropTypes from 'prop-types';
import React, { useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { getIntroOffers, isFetchingIntroOffers } from 'state/intro-offers';
import { isFetchingSiteDiscount, getSiteDiscount } from 'state/site/reducer';
import DiscountBadge from '../discount-badge';
import withUpgradeUrl from '../hoc/with-upgrade-url';
import RecommendedHeader from '../sidebar/recommended-header';
import { isCouponValid } from '../utils';

import './style.scss';
const Price = ( { className, integer, fraction, symbol } ) => (
	<div className={ className }>
		<sup className="jp-recommendations-product-card-upsell__currency-symbol">{ symbol }</sup>
		<span className="jp-recommendations-product-card-upsell__price-integer">{ integer }</span>
		<sup className="jp-recommendations-product-card-upsell__price-fraction">{ fraction }</sup>
	</div>
);

const ProductCardUpsellComponent = ( {
	slug,
	cost,
	title,
	description,
	billing_timeframe,
	cost_timeframe,
	currency_code: currency,
	isRecommended,
	features,
	onClick,
	onMount,
	isFetchingDiscount,
	isFetchingOffers,
	discountData,
	introOffers,
	upgradeUrl,
} ) => {
	const { discount } = discountData;
	const hasDiscount = useMemo( () => isCouponValid( discountData ), [ discountData ] );

	const introOffer = useMemo(
		() => introOffers.find( ( { product_slug } ) => product_slug === slug ) || {},
		[ slug, introOffers ]
	);
	const { original_price: introOriginalPrice, raw_price: introRawPrice } = introOffer;
	// introOriginalPrice is the price per year before introductory offer. Defaults to `cost`
	// (which is cost per month) if there's no such offer available.
	const initialPrice = introOriginalPrice || cost * 12;
	// introRawPrice is the price after introductory offer, but before any other discount.
	const introPrice = introRawPrice || initialPrice;
	const isTrial = isFirstMonthTrial( introOffer );
	// Apply special discount if there's a discount and is not a first month trial.
	const finalPrice =
		! isTrial && hasDiscount && discount ? introPrice * ( 1 - discount / 100 ) : introPrice;

	// Compute total discount, including introductory offer (if it exists) and special discount.
	const totalDiscount = initialPrice
		? Math.round( ( ( initialPrice - finalPrice ) / initialPrice ) * 100 )
		: null;

	// Get price parts, such as currency symbol and value.
	const initialCurrencyObject = useMemo(
		() => getCurrencyObject( initialPrice / 12, currency ),
		[ initialPrice, currency ]
	);
	const currencyObject = useMemo(
		() => getCurrencyObject( finalPrice / 12, currency ),
		[ finalPrice, currency ]
	);

	const checkoutUrl = new URL( upgradeUrl );

	// Remove the coupon code from the URL if it's a trial.
	// This is mostly to avoid confusion since the UI won't show the discount either
	if ( isTrial ) {
		checkoutUrl.searchParams.delete( 'coupon' );
	}

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
			className={ clsx( 'jp-recommendations-product-card-upsell', {
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
			{ ! ( isFetchingDiscount || isFetchingOffers ) && (
				<>
					<div className="jp-recommendations-product-card-upsell__price-container">
						<div className="jp-recommendations-product-card-upsell__price">
							{ hasDiscount && (
								<Price
									className="jp-recommendations-product-card-upsell__raw-price"
									{ ...initialCurrencyObject }
								/>
							) }
							<Price
								className="jp-recommendations-product-card-upsell__final-price"
								{ ...currencyObject }
							/>
							{ hasDiscount && (
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
				href={ checkoutUrl.toString() }
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
	slug: PropTypes.string.isRequired,
	cost: PropTypes.number,
	title: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	billing_timeframe: PropTypes.string.isRequired,
	cost_timeframe: PropTypes.string.isRequired,
	currency_code: PropTypes.string.isRequired,
	features: PropTypes.arrayOf( PropTypes.string ).isRequired,
	isRecommended: PropTypes.bool,
	onClick: PropTypes.func,
	onMount: PropTypes.func,
};

const ProductCardUpsell = connect( state => ( {
	isFetchingDiscount: isFetchingSiteDiscount( state ),
	isFetchingOffers: isFetchingIntroOffers( state ),
	discountData: getSiteDiscount( state ),
	introOffers: getIntroOffers( state ),
} ) )( withUpgradeUrl( ProductCardUpsellComponent ) );

export { ProductCardUpsell };
