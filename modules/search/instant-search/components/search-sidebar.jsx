/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import { createPortal, useState, useEffect } from 'preact/compat';
import SearchFilters from './search-filters';
import WidgetAreaContainer from './widget-area-container';

/**
 * Internal dependencies
 */
import JetpackColophon from './jetpack-colophon';

const SearchSidebar = props => {
	// TODO: Change JetpackInstantSearchOptions.widgets to only include info from widgets inside Overlay sidebar
	const [ widgetIds, setWidgetIds ] = useState( [] );

	useEffect( () => {
		const widgetArea = document.getElementsByClassName(
			'jetpack-instant-search__widget-area'
		)[ 0 ];
		const widgets = Array.from( widgetArea.querySelectorAll( '.jetpack-instant-search-wrapper' ) );

		widgets.forEach( widget => {
			const form = widget.querySelector( '.jetpack-search-form' );
			form && widget.removeChild( form );
		} );

		setWidgetIds( widgets.map( element => element.id ) );
	}, [] );

	return (
		<div className="jetpack-instant-search__sidebar">
			<WidgetAreaContainer />
			{ props.widgets
				.filter( widget => widgetIds.includes( `${ widget.widget_id }-wrapper` ) )
				.map( widget => {
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
			{ props.showPoweredBy && <JetpackColophon /> }
		</div>
	);
};
export default SearchSidebar;
