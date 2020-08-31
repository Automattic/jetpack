/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { jetpackCreateInterpolateElement } from 'components/create-interpolate-element';
import { getCurrencyObject } from '@automattic/format-currency';
import { __, sprintf } from '@wordpress/i18n';

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

		if ( ! higherPrice ) {
			return (
				<>
					{ jetpackCreateInterpolateElement(
						/* translators: This shows a price, like $22. */
						__( '<Currency /><Price />', 'jetpack' ),
						{
							Currency: (
								<sup className="plan-price__currency-symbol">{ priceRange[ 0 ].price.symbol }</sup>
							),
							Price: smallerPrice,
						}
					) }
				</>
			);
		}

		return (
			<>
				{ jetpackCreateInterpolateElement(
					/* translators: This shows a price range, like $ 22-55. */
					__( '<Currency /><smallerPrice />-<higherPrice />', 'jetpack' ),
					{
						Currency: (
							<sup className="plan-price__currency-symbol">{ priceRange[ 0 ].price.symbol }</sup>
						),
						smallerPrice: smallerPrice,
						higherPrice: higherPrice,
					}
				) }
			</>
		);
	}

	render() {
		const { className, discounted, inline, original, rawPrice } = this.props;

		if ( rawPrice === undefined ) {
			return null;
		}

		const WrapperComponent = inline ? 'span' : 'div';
		const classes = classNames( 'plan-price', className, {
			'is-discounted': discounted,
			'is-inline': inline,
			'is-original': original,
		} );

		return <WrapperComponent className={ classes }>{ this.renderContent() }</WrapperComponent>;
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
