/**
 * External dependencies
 */
import debugFactory from 'debug';

/**
 * Internal dependencies
 */
import buildUrl from './build-url';

const debug = debugFactory( 'calypso:url-search' );

export default {
	getInitialState: function () {
		return {
			searchOpen: false,
		};
	},

	UNSAFE_componentWillReceiveProps: function ( nextProps ) {
		if ( ! nextProps.search ) {
			this.setState( {
				searchOpen: false,
			} );
		}
	},

	doSearch: function ( keywords ) {
		let searchURL;

		this.setState( {
			searchOpen: false !== keywords,
		} );

		if ( this.onSearch ) {
			this.onSearch( keywords );
			return;
		}

		if ( this.buildUrl && 'function' === typeof this.buildUrl ) {
			searchURL = this.buildUrl( window.location.href, keywords );
		} else {
			searchURL = buildUrl( window.location.href, keywords );
		}

		debug( 'search posts for:', keywords );
		debug( 'setting URL: ' + searchURL );
		window.location.href = searchURL;
	},

	getSearchOpen: function () {
		return this.state.searchOpen !== false || this.props.search;
	},
};
