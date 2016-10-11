/**
 * External dependencies
 */
import qs from 'querystring';
import { translate as __ } from 'i18n-calypso';

var baseUrl = '//widgets.wp.com/sharing-buttons-preview/';

module.exports = {
	generatePreviewUrlFromButtons: function( buttons, showMore ) {
		var numberOfCustomButtons = 0,
			query = {};

		// Build the query parameter array of services names to be rendered
		// by the official sharing buttons preview widget
		buttons.forEach( function( button ) {
			var index;

			if ( button.custom ) {
				// Custom buttons previews are specified by index using the
				// name and a URL to the icon
				index = numberOfCustomButtons++;
				query['custom[' + index + '][name]'] = encodeURIComponent( button.name );
				query['custom[' + index + '][icon]'] = encodeURIComponent( button.icon );
			} else {
				query['service[]'] = query['service[]'] || [];
				query['service[]'].push( button.ID );
			}
		} );

		if ( showMore ) {
			query.more = __( 'More' );
		}

		return baseUrl + '?' + qs.stringify( query );
	}
};
