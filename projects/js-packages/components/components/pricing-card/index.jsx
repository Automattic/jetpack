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

const PricingCard = props => {
	const currencyObjectBefore = getCurrencyObject( props.priceBefore, props.currencyCode );
	const currencyObjectAfter = getCurrencyObject( props.priceAfter, props.currencyCode );

	const showPriceDecimals = currencyObject => {
		return currencyObject.fraction.indexOf( '00' ) === -1;
	};

	return (
		<div className="pricing__card">
			{ props.icon && (
				<div className="pricing__card--icon">
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
			<h1 className="pricing__card--title">{ props.title }</h1>
			<div className="pricing__card--pricing">
				<div className="pricing__card--price-before">
					<span className="pricing__card--currency">{ currencyObjectBefore.symbol }</span>
					<span className="pricing__card--price">{ currencyObjectBefore.integer }</span>
					{ showPriceDecimals( currencyObjectBefore ) && (
						<span className="pricing__card--price-decimal"> { currencyObjectBefore.fraction }</span>
					) }
					<div className="pricing__card--price-strikethrough"></div>
				</div>
				<div className="pricing__card--price-after">
					<span className="pricing__card--currency">{ currencyObjectAfter.symbol }</span>
					<span className="pricing__card--price">{ currencyObjectAfter.integer }</span>
					{ showPriceDecimals( currencyObjectAfter ) && (
						<span className="pricing__card--price-decimal">{ currencyObjectAfter.fraction }</span>
					) }
				</div>
				<span className="pricing__card--price-details">{ props.priceDetails }</span>
			</div>

			{ props.children && (
				<div className="pricing__card--extra-content-wrapper">{ props.children }</div>
			) }

			{ props.ctaText && (
				<div className="pricing__card--cta">
					<Button
						className="pricing__card--button"
						label={ props.ctaText }
						onClick={ props.onCtaClick }
					>
						{ props.ctaText }
					</Button>
				</div>
			) }

			{ props.infoText && <div className="pricing__card--info">{ props.infoText }</div> }
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
