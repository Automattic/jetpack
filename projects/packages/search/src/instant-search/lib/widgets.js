/**
 * Returns true if the given value is a well-formed filter configuration
 * object, i.e. one with a `filter_id`, matching what Helper::get_filters_from_widgets()
 * always sets in PHP.
 *
 * @param {*} filter - value to check.
 * @return {boolean} whether the filter is well-formed.
 */
function isValidFilter( filter ) {
	return (
		!! filter &&
		typeof filter === 'object' &&
		! Array.isArray( filter ) &&
		typeof filter.filter_id === 'string' &&
		filter.filter_id !== ''
	);
}

/**
 * Returns true if the given value is a well-formed Jetpack Search widget
 * configuration object, i.e. one that has both a `widget_id` and a `filters`
 * array, matching the shape Helper::generate_initial_javascript_state()
 * always produces in PHP.
 *
 * @param {*} widget - value to check.
 * @return {boolean} whether the widget is well-formed.
 */
function isValidWidget( widget ) {
	return (
		!! widget &&
		typeof widget === 'object' &&
		! Array.isArray( widget ) &&
		typeof widget.widget_id === 'string' &&
		widget.widget_id !== '' &&
		Array.isArray( widget.filters )
	);
}

/**
 * Normalizes a localized `widgets`/`widgetsOutsideOverlay` value into an
 * array of well-formed widget objects, dropping anything malformed —
 * including malformed entries within an otherwise well-formed widget's
 * `filters` array. Guards against a missing or malformed localized
 * configuration crashing the app.
 *
 * @param {*} widgets - localized widgets value.
 * @return {object[]} normalized widgets.
 */
export function normalizeWidgets( widgets ) {
	return Array.isArray( widgets )
		? widgets
				.filter( isValidWidget )
				.map( widget => ( { ...widget, filters: widget.filters.filter( isValidFilter ) } ) )
		: [];
}
