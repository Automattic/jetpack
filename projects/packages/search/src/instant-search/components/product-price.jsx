/**
 * External dependencies
 */
import React, { Component, Fragment } from 'react';

/**
 * Style dependencies
 */
import './product-price.scss';

class ProductPrice extends Component {
	render() {
		const {
			formattedPrice,
			formattedSalePrice,
			formattedRegularPrice,
			price,
			salePrice,
		} = this.props;

		if ( ! price ) {
			return null;
		}

		/* eslint-disable react/no-danger */
		return (
			<span className="jetpack-instant-search__product-price">
				{ salePrice > 0 ? (
					<Fragment>
						<s
							className="jetpack-instant-search__product-price-regular"
							dangerouslySetInnerHTML={ { __html: formattedRegularPrice } }
						></s>
						<span dangerouslySetInnerHTML={ { __html: formattedSalePrice } }></span>
					</Fragment>
				) : (
					<span dangerouslySetInnerHTML={ { __html: formattedPrice } }></span>
				) }
			</span>
		);
		/* eslint-enable react/no-danger */
	}
}

export default ProductPrice;
