/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';

const SearchResultComments = ( { comments, iconSize = 18 } ) => {
	if ( ! comments ) {
		return null;
	}

	return (
		<div className="jetpack-instant-search__result-comments">
			<Gridicon icon="comment" size={ iconSize } />
			<span
				className="jetpack-instant-search__result-comments-text"
				//eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={ {
					__html: comments.join( ' ... ' ),
				} }
			/>
		</div>
	);
};

export default SearchResultComments;
