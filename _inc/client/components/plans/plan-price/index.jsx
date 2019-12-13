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

		// "Normalize" the input price or price range.
		const rawPriceRange = Array.isArray( rawPrice ) ? rawPrice.slice( 0, 2 ) : [ rawPrice ];
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

	render() {
		const { className, currencyCode, discounted, original, rawPrice } = this.props;

		if ( ! currencyCode || ! rawPrice ) {
			return null;
		}

		const classes = classNames( 'plan-price', className, {
			'is-original': original,
			'is-discounted': discounted,
		} );

		const priceRange = this.getPriceRange();
		const smallerPrice = this.renderPrice( priceRange[ 0 ] );
		const higherPrice = priceRange[ 1 ] && this.renderPrice( priceRange[ 1 ] );

		return (
			<div className={ classes }>
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
			</div>
		);
	}
}

export default PlanPrice;

PlanPrice.propTypes = {
	className: PropTypes.string,
	currencyCode: PropTypes.string,
	discounted: PropTypes.bool,
	original: PropTypes.bool,
	rawPrice: PropTypes.oneOfType( [ PropTypes.number, PropTypes.arrayOf( PropTypes.number ) ] ),
};

PlanPrice.defaultProps = {
	className: '',
	currencyCode: 'USD',
	discounted: false,
	original: false,
};
