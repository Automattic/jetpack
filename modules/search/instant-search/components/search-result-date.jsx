/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';

const SearchResultDate = ( { date, locale = 'en-US' } ) => {
	if ( ! date ) {
		return null;
	}

	const resultDate = new Date( date.split( ' ' )[ 0 ] );
	return (
		<time
			className="jetpack-instant-search__search-result-date"
			datetime={ resultDate.toISOString() }
		>
			{ resultDate.toLocaleDateString( locale, {
				dateStyle: 'short',
			} ) }
		</time>
	);
};

export default SearchResultDate;
