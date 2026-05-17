import * as React from 'react';
import { createPortal } from 'react-dom';
import SearchFilters from './search-filters';
import WidgetAreaContainer from './widget-area-container';

import './sidebar.scss';

const Sidebar = props => {
	return (
		<div className="jetpack-instant-search__sidebar">
			{ props.citations?.length > 0 && (
				<div className="jetpack-instant-search__sidebar-citations">
					{ props.citations.map( ( citation, i ) => (
						<a
							key={ i }
							href={ /^https?:\/\//i.test( citation.url ) ? citation.url : '#' }
							className="jetpack-instant-search__sidebar-citation-card"
							target="_blank"
							rel="noopener noreferrer"
						>
							<span className="jetpack-instant-search__sidebar-citation-title">
								{ citation.title }
							</span>
							<span className="jetpack-instant-search__sidebar-citation-url">
								{ ( () => {
									try {
										return new URL( citation.url ).hostname;
									} catch {
										return '';
									}
								} )() }
							</span>
						</a>
					) ) }
				</div>
			) }
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
		</div>
	);
};
export default Sidebar;
