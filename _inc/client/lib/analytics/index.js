/**
 * External dependencies
 */
const debug = require( 'debug' )( 'dops:analytics' ),
	assign = require( 'lodash/assign' );

/**
 * Internal dependencies
 */
const config = require( 'config' );
let _superProps,
	_user;

// Load tracking scripts
window._tkq = window._tkq || [];
window.ga = window.ga || function() {
	( window.ga.q = window.ga.q || [] ).push( arguments );
};
window.ga.l = +new Date();

// loadScript( '//stats.wp.com/w.js?48' );
// loadScript( '//www.google-analytics.com/analytics.js' );

function buildQuerystring( group, name ) {
	let uriComponent = '';

	if ( 'object' === typeof group ) {
		for ( const key in group ) {
			uriComponent += '&x_' + encodeURIComponent( key ) + '=' + encodeURIComponent( group[ key ] );
		}
		debug( 'Bumping stats %o', group );
	} else {
		uriComponent = '&x_' + encodeURIComponent( group ) + '=' + encodeURIComponent( name );
		debug( 'Bumping stat "%s" in group "%s"', name, group );
	}

	return uriComponent;
}

function buildQuerystringNoPrefix( group, name ) {
	let uriComponent = '';

	if ( 'object' === typeof group ) {
		for ( const key in group ) {
			uriComponent += '&' + encodeURIComponent( key ) + '=' + encodeURIComponent( group[ key ] );
		}
		debug( 'Built stats %o', group );
	} else {
		uriComponent = '&' + encodeURIComponent( group ) + '=' + encodeURIComponent( name );
		debug( 'Built stat "%s" in group "%s"', name, group );
	}

	return uriComponent;
}

const analytics = {

	initialize: function( userId, username, superProps ) {
		analytics.setUser( userId, username );
		analytics.setSuperProps( superProps );
		analytics.identifyUser();
	},

	setUser: function( userId, username ) {
		_user = { ID: userId, username: username };
	},

	setSuperProps: function( superProps ) {
		_superProps = superProps;
	},

	mc: {
		bumpStat: function( group, name ) {
			const uriComponent = buildQuerystring( group, name ); // prints debug info
			if ( config( 'mc_analytics_enabled' ) ) {
				new Image().src = document.location.protocol + '//pixel.wp.com/g.gif?v=wpcom-no-pv' + uriComponent + '&t=' + Math.random();
			}
		},

		bumpStatWithPageView: function( group, name ) {
			// this function is fairly dangerous, as it bumps page views for wpcom and should only be called in very specific cases.
			const uriComponent = buildQuerystringNoPrefix( group, name ); // prints debug info
			if ( config( 'mc_analytics_enabled' ) ) {
				new Image().src = document.location.protocol + '//pixel.wp.com/g.gif?v=wpcom' + uriComponent + '&t=' + Math.random();
			}
		}
	},

	// pageView is a wrapper for pageview events across Tracks and GA
	pageView: {
		record: function( urlPath, pageTitle ) {
			analytics.tracks.recordPageView( urlPath );
			analytics.ga.recordPageView( urlPath, pageTitle );
		}
	},

	purchase: {
		record: function( transactionId, itemName, itemId, revenue, price, qty, currency ) {
			analytics.ga.recordPurchase( transactionId, itemName, itemId, revenue, price, qty, currency );
		}
	},

	tracks: {
		recordEvent: function( eventName, eventProperties ) {
			let superProperties;

			eventProperties = eventProperties || {};

			debug( 'Record event "%s" called with props %s', eventName, JSON.stringify( eventProperties ) );
			if ( eventName.indexOf( 'akismet_' ) !== 0 && eventName.indexOf( 'jetpack_' ) !== 0 ) {
				debug( '- Event name must be prefixed by "akismet_" or "jetpack_"' );
				return;
			}

			if ( _superProps ) {
				superProperties = _superProps.getAll();
				debug( '- Super Props: %o', superProperties );
				eventProperties = assign( eventProperties, superProperties );
			}

			window._tkq.push( [ 'recordEvent', eventName, eventProperties ] );
		},

		recordJetpackClick: function( target ) {
			const props = 'object' === typeof target ? target : { target: target };

			analytics.tracks.recordEvent( 'jetpack_wpa_click', props );
		},

		recordPageView: function( urlPath ) {
			analytics.tracks.recordEvent( 'akismet_page_view', {
				path: urlPath
			} );
		},

		setOptOut: function( isOptingOut ) {
			debug( 'Pushing setOptOut: %o', isOptingOut );
			window._tkq.push( [ 'setOptOut', isOptingOut ] );
		}
	},

	// Google Analytics usage and event stat tracking
	ga: {

		initialized: false,

		initialize: function() {
			let parameters = {};
			if ( ! analytics.ga.initialized ) {
				if ( _user ) {
					parameters = {
						userId: 'u-' + _user.ID
					};
				}
				window.ga( 'create', config( 'google_analytics_key' ), 'auto', parameters );
				analytics.ga.initialized = true;
			}
		},

		recordPageView: function( urlPath, pageTitle ) {
			analytics.ga.initialize();

			debug( 'Recording Page View ~ [URL: ' + urlPath + '] [Title: ' + pageTitle + ']' );

			if ( config( 'google_analytics_enabled' ) ) {
				// Set the current page so all GA events are attached to it.
				window.ga( 'set', 'page', urlPath );

				window.ga( 'send', {
					hitType: 'pageview',
					page: urlPath,
					title: pageTitle
				} );
			}
		},

		recordEvent: function( category, action, label, value ) {
			analytics.ga.initialize();

			let debugText = 'Recording Event ~ [Category: ' + category + '] [Action: ' + action + ']';

			if ( 'undefined' !== typeof label ) {
				debugText += ' [Option Label: ' + label + ']';
			}

			if ( 'undefined' !== typeof value ) {
				debugText += ' [Option Value: ' + value + ']';
			}

			debug( debugText );

			if ( config( 'google_analytics_enabled' ) ) {
				window.ga( 'send', 'event', category, action, label, value );
			}
		},

		recordPurchase: function( transactionId, itemName, itemId, revenue, price, qty, currency ) {
			window.ga( 'require', 'ecommerce' );
			window.ga( 'ecommerce:addTransaction', {
				id: transactionId, // Transaction ID. Required.
				// 'affiliation': 'Acme Clothing',   // Affiliation or store name.
				revenue: revenue, // Grand Total.
				// 'tax': '1.29',                     // Tax.
				currency: currency // local currency code.
			} );
			window.ga( 'ecommerce:addItem', {
				id: transactionId, // Transaction ID. Required.
				name: itemName, // Product name. Required.
				sku: itemId, // SKU/code.
				// 'category': 'Party Toys',         // Category or variation.
				price: price, // Unit price.
				quantity: qty // Quantity.
			} );
			window.ga( 'ecommerce:send' );
		}
	},

	identifyUser: function() {
		// Don't identify the user if we don't have one
		if ( _user ) {
			window._tkq.push( [ 'identifyUser', _user.ID, _user.username ] );
		}
	},

	setProperties: function( properties ) {
		window._tkq.push( [ 'setProperties', properties ] );
	},

	clearedIdentity: function() {
		window._tkq.push( [ 'clearIdentity' ] );
	}
};

module.exports = analytics;
