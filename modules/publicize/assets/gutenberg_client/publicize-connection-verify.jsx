/**
 * Publicize connections verification component.
 *
 * Component to create Ajax request to check
 * all connections. If any connection tests failed,
 * a refresh link may be provided to the user. If
 * no connection tests fail, this component will
 * not render anything.
 *
 * @since  5.9.1
 */

/**
 * External dependencies
 */
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
const { __ } = wp.i18n;

class PublicizeConnectionVerify extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			failedConnections: {},
			isLoading: false,
		}
	}

	/**
	 * Callback for connection test request
	 *
	 * Receives results of connection request and
	 * updates component state to display potentially
	 * failed connections.
	 *
	 * @since 5.9.1
	 *
	 * @param object response from ajax action 'wp_ajax_test_publicize_conns' {@see publicize.php}
	 */
	connectionTestComplete = ( response ) =>  {
		var failureList = response.data.filter( connection => ( ! connection.connectionTestPassed ) );
		this.setState( {
			failedConnections: failureList,
			isLoading: false,
		} );
	}

	/**
	 * Starts request to check connections
	 *
	 * Checks connections with ajax action 'wp_ajax_test_publicize_conns'
	 *
	 * @see publicize.php
	 *
	 * @since 5.9.1
	 */
	connectionTestStart = () =>  {
		// Ajax request handled by 'wp_ajax_test_publicize_conns' action in {@see publicize.php}.
		$.post( ajaxurl, { action: 'test_publicize_conns' }, this.connectionTestComplete );
		this.setState( {
			isLoading: true,
		} );
	}


	/**
	 * Opens up popup so user can refresh connection
	 *
	 * Displays pop up with to specified URL where user
	 * can refresh a specific connection.
	 *
	 * @since 5.9.1
	 *
	 * @param string title       Title for popup.
	 * @param string refreshHref Target URL for refresh popup.
	 * @param object event       Event instance for onClick.
	 */
	refreshConnectionClick( title, refreshHref, event ) {
		event.preventDefault();
		// open a popup window
		// when it is closed, kick off the tests again
		var popupWin = window.open( refreshHref, title, '' );
		var that = this;
		var popupWinTimer= window.setInterval( function() {
			if ( popupWin.closed !== false ) {
				window.clearInterval( popupWinTimer );
				that.connectionTestStart();
			}
		}, 500 );

	}

	componentDidMount() {
		this.connectionTestStart();
	}


	render() {
		const { failedConnections }  = this.state;
		if ( failedConnections.length > 0) {
			return (
				<div className='below-h2 error publicize-token-refresh-message'>
					<p key='error-title'>{__( 'Before you hit Publish, please refresh the following connection(s) to make sure we can Publicize your post:' )}</p>
					{ failedConnections.filter( c => c.userCanRefresh ).map( c =>
						<a
							className='pub-refresh-button button'
							title={ c.refreshText }
							href={ c.refreshURL }
							target={'_refresh_' + c.serviceName }
							onClick={ ( event ) => this.refreshConnectionClick( c.refreshText, c.refreshURL, event ) }
							key={ c.connectionID }

						>
							{ c.refreshText }
						</a>
					) }

				</div>
			);
		} else {
			return null;
		}

	}
}

export default PublicizeConnectionVerify;

