/**
 * External dependencies
 */
import React from 'react';
import { createPortal } from 'react-dom';
import SearchFilters from './search-filters';
import WidgetAreaContainer from './widget-area-container';

/**
 * Internal dependencies
 */
import JetpackColophon from './jetpack-colophon';
import './sidebar.scss';

const Sidebar = props => {
	return (
		<div className="jetpack-instant-search__sidebar">
			{ /* If widgetOutsideOverlay doesn't contain any filters,
			     this component will just show the title and clear filters button. */ }
			<SearchFilters
				filters={ props.filters }
				staticFilters={ props.staticFilters }
				loading={ props.isLoading }
				locale={ props.locale }
				postTypes={ props.postTypes }
				results={ props.response }
				showClearFiltersButton={ true }
				widget={ props.widgetOutsideOverlay }
			/>
			<WidgetAreaContainer />
			{ props.widgets.map( widget => {
				// Creates portals to elements moved into the WidgetAreaContainer.
				return createPortal(
					<div
						id={ `${ widget.widget_id }-portaled-wrapper` }
						className="jetpack-instant-search__portaled-wrapper"
					>
						<SearchFilters
							filters={ props.filters }
							staticFilters={ props.staticFilters }
							loading={ props.isLoading }
							locale={ props.locale }
							postTypes={ props.postTypes }
							results={ props.response }
							showClearFiltersButton={ false }
							showTitle={ false }
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
export default Sidebar;
