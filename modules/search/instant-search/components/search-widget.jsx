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

const SearchWidget = props => {
	return createPortal(
		<div
			id={ `${ props.widget.widget_id }-portaled-wrapper` }
			className="jetpack-instant-search__portaled-wrapper"
		>
			<SearchForm { ...props } />
		</div>,
		document.getElementById( `${ props.widget.widget_id }-wrapper` )
	);
};

export default SearchWidget;
