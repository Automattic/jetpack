/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import { createPortal } from 'preact/compat';

/**
 * Internal dependencies
 */
import SearchForm from './search-form';

const SearchWidget = ( { widget } ) => {
	return createPortal(
		<div
			id={ `${ widget.widget_id }-portaled-wrapper` }
			className="jetpack-instant-search__portaled-wrapper"
		>
			<SearchForm widget={ widget } />
		</div>,
		document.getElementById( `${ widget.widget_id }-wrapper` )
	);
};

export default SearchWidget;
