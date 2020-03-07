/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import { createPortal } from 'preact/compat';
import SearchFilters from './search-filters';
import WidgetAreaContainer from './widget-area-container';

/**
 * Internal dependencies
 */
import JetpackColophon from './jetpack-colophon';

const SearchSidebar = props => {
	return (
		<div className="jetpack-instant-search__sidebar">
			<WidgetAreaContainer />
			{ props.widgets.map( widget => {
				return createPortal(
					<div
						id={ `${ widget.widget_id }-portaled-wrapper` }
						className="jetpack-instant-search__portaled-wrapper"
					>
						<SearchFilters
							loading={ props.isLoading }
							locale={ props.locale }
							postTypes={ props.postTypes }
							results={ props.response }
							widget={ widget }
						/>
					</div>,
					document.getElementById( `${ widget.widget_id }-wrapper` )
				);
			} ) }
			{ props.showPoweredBy && <JetpackColophon locale={ props.locale } /> }
		</div>
	);
};
export default SearchSidebar;
