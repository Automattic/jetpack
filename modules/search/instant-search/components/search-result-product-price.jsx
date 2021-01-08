/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';

/**
 * Style dependencies
 */
//import './search-result-product-price.scss';

class SearchResultProductPrice extends Component {
	render() {
		const { value, currencyPosition, currencySymbol } = this.props;

		if ( ! value ) {
			return null;
		}

		return (
			<span className="jetpack-instant-search__search-result-product-price">
				{ currencyPosition !== 'right' && (
					<span
						className="jetpack-instant-search__search-result-product-price-currency-left"
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ {
							__html: currencySymbol,
						} }
					/>
				) }
				<span className="jetpack-instant-search__search-result-product-price-value">
					{ value.toFixed( 2 ) }
				</span>
				{ currencyPosition === 'right' && (
					<span
						className="jetpack-instant-search__search-result-product-price-currency-right"
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ {
							__html: currencySymbol,
						} }
					/>
				) }
			</span>
		);
	}
}

export default SearchResultProductPrice;
