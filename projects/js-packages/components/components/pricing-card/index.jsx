/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

const PricingCard = props => {
	const priceBeforeDecimal = props.priceBefore.split( '.' )[ 1 ];
	const priceAfterDecimal = props.priceAfter.split( '.' )[ 1 ];

	return (
		<div className="pricing__card">
			{ props.icon && (
				<div className="pricing__card--icon">
					<img src={ props.icon } alt="" />
				</div>
			) }
			<h1 className="pricing__card--title">{ props.title }</h1>
			<div className="pricing__card--pricing">
				<div className="pricing__card--price-before">
					<span className="pricing__card--currency">{ props.currencySymbol }</span>
					<span className="pricing__card--price">{ parseInt( props.priceBefore ) }</span>
					{ priceBeforeDecimal && (
						<span className="pricing__card--price-decimal"> .{ priceBeforeDecimal }</span>
					) }
					<div className="pricing__card--price-strikethrough"></div>
				</div>
				<div className="pricing__card--price-after">
					<span className="pricing__card--currency">{ props.currencySymbol }</span>
					<span className="pricing__card--price">{ parseInt( props.priceAfter ) }</span>
					{ priceAfterDecimal && (
						<span className="pricing__card--price-decimal">.{ priceAfterDecimal }</span>
					) }
					<span className="pricing__card--price-details">{ props.priceDetails }</span>
				</div>
			</div>
			<div className="pricing__card--cta">
				<Button
					className="pricing__card--button"
					label={ props.ctaText }
					onClick={ props.onCtaClick }
				>
					{ props.ctaText }
				</Button>
			</div>
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
	priceBefore: PropTypes.string.isRequired,
	/** Price after discount. */
	priceAfter: PropTypes.string.isRequired,
	/** Price details. */
	priceDetails: PropTypes.string,
	/** The Currency. */
	currencySymbol: PropTypes.oneOf( [ '$', '€' ] ),
	/** The CTA copy. */
	ctaText: PropTypes.string.isRequired,
	/** The CTA callback to be called on click. */
	onCtaClick: PropTypes.func.isRequired,
	/** Optional informative text. */
	infoText: PropTypes.string,
};

PricingCard.defaultProps = {
	currencySymbol: '$',
	priceDetails: __( '/month, paid yearly', 'jetpack' ),
};

export default PricingCard;
