/** @jsx h */
/**
 * External dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';
import { h } from 'preact';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';

/**
 * Style dependencies
 */
import './product-ratings.scss';

/**
 * Renders a hook-based component for displaying product ratings.
 *
 * @param {object} props - Component properties.
 * @param {number} props.count - Number of ratings.
 * @param {number} props.rating - Average rating out of five.
 * @returns {object} Product rating component.
 */
export default function ProductRatings( { rating = 0, count = 0 } ) {
	return (
		<div className="jetpack-instant-search__search-result-product-rating">
			<span aria-hidden className="jetpack-instant-search__search-result-product-rating-stars">
				{ Array( 5 )
					.fill( <Gridicon size={ 16 } icon="star-outline" /> )
					.fill( <Gridicon size={ 16 } icon="star" />, 0, rating ) }
			</span>{ ' ' }
			<span aria-hidden className="jetpack-instant-search__search-result-product-rating-count">
				{ count }
			</span>
			<span className="screen-reader-text">
				{ sprintf(
					_n(
						'Average rating of %s out of 5 from %s rating.',
						'Average rating of %s out of 5 from %s ratings.',
						count,
						'jetpack'
					),
					Number( rating ).toFixed( 2 ),
					count
				) }
			</span>
		</div>
	);
}
