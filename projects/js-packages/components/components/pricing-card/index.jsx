/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@wordpress/components';
import { getCurrencyObject } from '@automattic/format-currency';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * Whether or not to display a price's decimal part in the UI.
 * Needed as `getCurrencyObject` will always return the decimal part populated even if it
 * doesn't exist.
 *
 * @param {object} currencyObject -- A currency object returned from `getCurrencyObject`.
 * @returns {boolean} Whether or not to display the price decimal part.
 */
const showPriceDecimals = currencyObject => {
	return currencyObject.fraction.indexOf( '00' ) === -1;
};

/**
 * The Pricing card component.
 *
 * @param {object} props -- The properties.
 * @returns {React.Component} The `PricingCard` component.
 */
const PricingCard = props => {
	const currencyObjectBefore = getCurrencyObject( props.priceBefore, props.currencyCode );
	const currencyObjectAfter = getCurrencyObject( props.priceAfter, props.currencyCode );

	return (
		<div className="jp-components__pricing-card">
			{ props.icon && (
				<div className="jp-components__pricing-card__icon">
					<img
						src={ props.icon }
						alt={ sprintf(
							/* translators: placeholder is a product name */
							__( 'Icon for the product %s', 'jetpack' ),
							props.title
						) }
					/>
				</div>
			) }
			<h1 className="jp-components__pricing-card__title">{ props.title }</h1>
			<div className="jp-components__pricing-card__pricing">
				<div className="jp-components__pricing-card__price-before">
					<span className="jp-components__pricing-card__currency">
						{ currencyObjectBefore.symbol }
					</span>
					<span className="jp-components__pricing-card__price">
						{ currencyObjectBefore.integer }
					</span>
					{ showPriceDecimals( currencyObjectBefore ) && (
						<span className="jp-components__pricing-card__price-decimal">
							{ ' ' }
							{ currencyObjectBefore.fraction }
						</span>
					) }
					<div className="jp-components__pricing-card__price-strikethrough"></div>
				</div>
				<div className="jp-components__pricing-card__price-after">
					<span className="jp-components__pricing-card__currency">
						{ currencyObjectAfter.symbol }
					</span>
					<span className="jp-components__pricing-card__price">
						{ currencyObjectAfter.integer }
					</span>
					{ showPriceDecimals( currencyObjectAfter ) && (
						<span className="jp-components__pricing-card__price-decimal">
							{ currencyObjectAfter.fraction }
						</span>
					) }
				</div>
				<span className="jp-components__pricing-card__price-details">{ props.priceDetails }</span>
			</div>

			{ props.children && (
				<div className="jp-components__pricing-card__extra-content-wrapper">{ props.children }</div>
			) }

			{ props.ctaText && (
				<div className="jp-components__pricing-card__cta">
					<Button
						className="jp-components__pricing-card__button"
						label={ props.ctaText }
						onClick={ props.onCtaClick }
					>
						{ props.ctaText }
					</Button>
				</div>
			) }

			{ props.infoText && (
				<div className="jp-components__pricing-card__info">{ props.infoText }</div>
			) }
		</div>
	);
};

PricingCard.propTypes = {
	/** The Title. */
	title: PropTypes.string.isRequired,
	/** The Icon. */
	icon: PropTypes.string,
	/** Price before discount. */
	priceBefore: PropTypes.number.isRequired,
	/** Price after discount. */
	priceAfter: PropTypes.number.isRequired,
	/** Price details. */
	priceDetails: PropTypes.string,
	/** The Currency code, eg 'USD'. */
	currencyCode: PropTypes.string,
	/** The CTA copy. */
	ctaText: PropTypes.string,
	/** The CTA callback to be called on click. */
	onCtaClick: PropTypes.func,
	/** Optional informative text. */
	infoText: PropTypes.oneOfType( [ PropTypes.string, PropTypes.object ] ),
};

PricingCard.defaultProps = {
	currencyCode: 'USD',
	priceDetails: __( '/month, paid yearly', 'jetpack' ),
};

export default PricingCard;
