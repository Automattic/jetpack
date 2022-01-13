/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';
import './search-result-comments.scss';

const SearchResultComments = ( { comments, iconSize = 18 } ) => {
	if ( ! comments ) {
		return null;
	}

	return (
		<div className="jetpack-instant-search__search-result-comments">
			<Gridicon icon="comment" size={ iconSize } />
			<span
				className="jetpack-instant-search__search-result-comments-text"
				//eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={ {
					__html: comments.join( ' ... ' ),
				} }
			/>
		</div>
	);
};

export default SearchResultComments;
