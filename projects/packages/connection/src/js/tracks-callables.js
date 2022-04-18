/**
 * This was abstracted from wp-calypso's analytics lib: https://github.com/Automattic/wp-calypso/blob/master/client/lib/analytics/README.md
 * Some stuff was removed like GA tracking and other things not necessary for Jetpack tracking.
 *
 * This library should only be used and loaded if the Jetpack site is connected.
 */

// Load tracking scripts
window._tkq = window._tkq || [];

var _user;
var debug = console.error; // eslint-disable-line no-console

/**
 * @param group
 * @param name
 */
function buildQuerystring( group, name ) {
	var uriComponent = '';

	if ( 'object' === typeof group ) {
		for ( var key in group ) {
			uriComponent += '&x_' + encodeURIComponent( key ) + '=' + encodeURIComponent( group[ key ] );
		}
	} else {
		uriComponent = '&x_' + encodeURIComponent( group ) + '=' + encodeURIComponent( name );
	}

	return uriComponent;
}

var analytics = {
	initialize: function ( userId, username ) {
		analytics.setUser( userId, username );
		analytics.identifyUser();
	},

	mc: {
		bumpStat: function ( group, name ) {
			var uriComponent = buildQuerystring( group, name ); // prints debug info
			new Image().src =
				document.location.protocol +
				'//pixel.wp.com/g.gif?v=wpcom-no-pv' +
				uriComponent +
				'&t=' +
				Math.random();
		},
	},

	tracks: {
		recordEvent: function ( eventName, eventProperties ) {
			eventProperties = eventProperties || {};

			if ( eventName.indexOf( 'jetpack_' ) !== 0 ) {
				debug( '- Event name must be prefixed by "jetpack_"' );
				return;
			}

			window._tkq.push( [ 'recordEvent', eventName, eventProperties ] );
		},

		recordPageView: function ( urlPath ) {
			analytics.tracks.recordEvent( 'jetpack_page_view', {
				path: urlPath,
			} );
		},
	},

	setUser: function ( userId, username ) {
		_user = { ID: userId, username: username };
	},

	identifyUser: function () {
		// Don't identify the user if we don't have one
		if ( _user ) {
			window._tkq.push( [ 'identifyUser', _user.ID, _user.username ] );
		}
	},

	clearedIdentity: function () {
		window._tkq.push( [ 'clearIdentity' ] );
	},
};
