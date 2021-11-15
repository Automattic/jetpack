/**
 * External dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';
import React from 'react';

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
 * @param {string} props.permalink - Permalink URL to product page.
 * @returns {object} Product rating component.
 */
export default function ProductRatings( { rating = 0, count = 0, permalink } ) {
	return (
		<div className="jetpack-instant-search__product-rating">
			<span aria-hidden className="jetpack-instant-search__product-rating-stars">
				{ Array( 5 )
					.fill( <Gridicon size={ 16 } icon="star-outline" /> )
					.fill( <Gridicon size={ 16 } icon="star" />, 0, rating ) }
			</span>{ ' ' }
			<a
				aria-hidden
				className="jetpack-instant-search__product-rating-count"
				href={ permalink + '#reviews' }
			>
				{ sprintf(
					/* Translators: the placeholder is the number of product reviews. */
					_n( '%d review', '%d reviews', count, 'jetpack' ),
					count
				) }
			</a>
			<span className="screen-reader-text">
				{ sprintf(
					/* Translators: the first placeholder is the average product rating out of 5; the second is the number of product reviews. */
					_n(
						'Average rating of %d out of 5 from %d review.',
						'Average rating of %d out of 5 from %d reviews.',
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
