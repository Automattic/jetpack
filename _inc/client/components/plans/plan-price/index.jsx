/**
 * External dependencies
 */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';
import { translate as __ } from 'i18n-calypso';
import { getCurrencyObject } from '@automattic/format-currency';

/**
 * Style dependencies
 */
import './style.scss';

export class PlanPrice extends Component {
	getPriceRange() {
		const { currencyCode, rawPrice } = this.props;

		// "Normalize" the input price or price range
		let rawPriceRange;
		if ( Array.isArray( rawPrice ) ) {
			const positivePrices = rawPrice.filter( price => price >= 0 );
			// First array entry is lowest price, second is highest price.
			rawPriceRange = [ Math.min( ...positivePrices ), Math.max( ...positivePrices ) ];
		} else {
			rawPriceRange = [ rawPrice ];
		}
		if ( rawPriceRange.includes( 0 ) ) {
			return null;
		}

		return rawPriceRange.map( item => {
			return {
				price: getCurrencyObject( item, currencyCode ),
				raw: item,
			};
		} );
	}

	renderPrice( priceObj ) {
		return (
			<>
				<span className="plan-price__integer">{ priceObj.price.integer }</span>
				<sup className="plan-price__fraction">
					{ priceObj.raw - priceObj.price.integer > 0 && priceObj.price.fraction }
				</sup>
			</>
		);
	}

	renderContent() {
		const priceRange = this.getPriceRange();
		const smallerPrice = this.renderPrice( priceRange[ 0 ] );
		const higherPrice = priceRange[ 1 ] && this.renderPrice( priceRange[ 1 ] );

		return (
			<>
				<sup className="plan-price__currency-symbol">{ priceRange[ 0 ].price.symbol }</sup>
				{ ! higherPrice && this.renderPrice( priceRange[ 0 ] ) }
				{ higherPrice &&
					__( '{{smallerPrice/}}-{{higherPrice/}}', {
						components: {
							smallerPrice,
							higherPrice,
						},
						comment: 'The price range for a particular product',
					} ) }
			</>
		);
	}

	render() {
		const { className, currencyCode, discounted, inline, original, rawPrice } = this.props;

		if ( ! currencyCode || ! rawPrice ) {
			return null;
		}

		const classes = classNames( 'plan-price', className, {
			'is-discounted': discounted,
			'is-inline': inline,
			'is-original': original,
		} );

		return inline ? (
			<span className={ classes }>{ this.renderContent() }</span>
		) : (
			<div className={ classes }>{ this.renderContent() }</div>
		);
	}
}

export default PlanPrice;

PlanPrice.propTypes = {
	className: PropTypes.string,
	currencyCode: PropTypes.string,
	discounted: PropTypes.bool,
	inline: PropTypes.bool,
	original: PropTypes.bool,
	rawPrice: PropTypes.oneOfType( [ PropTypes.number, PropTypes.arrayOf( PropTypes.number ) ] ),
};

PlanPrice.defaultProps = {
	className: '',
	currencyCode: 'USD',
	discounted: false,
	original: false,
};
