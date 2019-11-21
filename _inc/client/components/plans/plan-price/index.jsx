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
	render() {
		const { currencyCode, rawPrice, original, discounted, className } = this.props;

		if ( ! currencyCode || ! rawPrice ) {
			return null;
		}

		// "Normalize" the input price or price range.
		const rawPriceRange = Array.isArray( rawPrice ) ? rawPrice.slice( 0, 2 ) : [ rawPrice ];
		if ( rawPriceRange.includes( 0 ) ) {
			return null;
		}

		const priceRange = rawPriceRange.map( item => {
			return {
				price: getCurrencyObject( item, currencyCode ),
				raw: item,
			};
		} );

		const classes = classNames( 'plan-price', className, {
			'is-original': original,
			'is-discounted': discounted,
		} );

		const renderPriceHtml = priceObj => {
			return (
				<>
					<span className="plan-price__integer">{ priceObj.price.integer }</span>
					<sup className="plan-price__fraction">
						{ priceObj.raw - priceObj.price.integer > 0 && priceObj.price.fraction }
					</sup>
				</>
			);
		};

		const smallerPriceHtml = renderPriceHtml( priceRange[ 0 ] );
		const higherPriceHtml = priceRange[ 1 ] && renderPriceHtml( priceRange[ 1 ] );

		return (
			<h4 className={ classes }>
				<sup className="plan-price__currency-symbol">{ priceRange[ 0 ].price.symbol }</sup>
				{ ! higherPriceHtml && renderPriceHtml( priceRange[ 0 ] ) }
				{ higherPriceHtml &&
					__( '{{smallerPrice/}}-{{higherPrice/}}', {
						components: { smallerPrice: smallerPriceHtml, higherPrice: higherPriceHtml },
						comment: 'The price range for a particular product',
					} ) }
			</h4>
		);
	}
}

export default PlanPrice;

PlanPrice.propTypes = {
	rawPrice: PropTypes.oneOfType( [ PropTypes.number, PropTypes.arrayOf( PropTypes.number ) ] ),
	original: PropTypes.bool,
	discounted: PropTypes.bool,
	currencyCode: PropTypes.string,
	className: PropTypes.string,
};

PlanPrice.defaultProps = {
	currencyCode: 'USD',
	original: false,
	discounted: false,
	className: '',
};
