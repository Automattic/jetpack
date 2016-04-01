/**
 * Utilities to work with widgets in Customizer.
 */

/**
 * Checks whether this Customizer supports partial widget refresh.
 * @returns {boolean}
 */
wp.customizerHasPartialWidgetRefresh = function() {
	return 'object' === typeof wp && 'function' === typeof wp.customize && 'object' === typeof wp.customize.selectiveRefresh && 'object' === typeof wp.customize.widgetsPreview && 'function' === typeof wp.customize.widgetsPreview.WidgetPartial;
};

/**
 * Verifies that the ID of the widget placed contains the widget name.
 * @param {object} placement
 * @param {string} widgetName
 * @returns {*|boolean}
 */
wp.isJetpackWidgetPlaced = function( placement, widgetName ) {
	var regex = new RegExp( '^' + widgetName + '-\\d+$', 'g' );
	return placement.partial.widgetId && regex.test( placement.partial.widgetId );
};