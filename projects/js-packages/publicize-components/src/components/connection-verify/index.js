/**
 * Publicize connections verification component.
 *
 * Component to create Ajax request to check
 * all connections. If any connection tests failed,
 * a refresh link may be provided to the user. If
 * no connection tests fail, this component will
 * not render anything.
 */

import { Notice } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { Component, Fragment } from '@wordpress/element';
import { SOCIAL_STORE_ID } from '../../social-store';

class PublicizeConnectionVerify extends Component {
	componentDidMount() {
		this.props.refreshConnections();
	}

	/**
	 * Opens up popup so user can refresh connection
	 *
	 * Displays pop up with to specified URL where user
	 * can refresh a specific connection.
	 *
	 * @param {object} event - Event instance for onClick.
	 */
	refreshConnectionClick = event => {
		const { href, title } = event.target;
		event.preventDefault();
		// open a popup window
		// when it is closed, kick off the tests again
		const popupWin = window.open( href, title, '' );
		const popupTimer = window.setInterval( () => {
			if ( false !== popupWin.closed ) {
				window.clearInterval( popupTimer );
				this.props.refreshConnections();
			}
		}, 500 );
	};

	renderNonRefreshableConnections() {
		const { failedConnections } = this.props;
		const nonRefreshableConnections = failedConnections.filter(
			connection => ! connection.can_refresh
		);

		if ( nonRefreshableConnections.length ) {
			return nonRefreshableConnections.map( connection => (
				<Notice className="jetpack-publicize-notice" isDismissible={ false } status="error">
					<p>{ connection.test_message }</p>
				</Notice>
			) );
		}

		return null;
	}

	render() {
		return <Fragment>{ this.renderNonRefreshableConnections() }</Fragment>;
	}
}

export default compose( [
	withSelect( select => ( {
		failedConnections: select( SOCIAL_STORE_ID ).getFailedConnections(),
	} ) ),
	withDispatch( dispatch => ( {
		refreshConnections: dispatch( SOCIAL_STORE_ID ).refreshConnectionTestResults,
	} ) ),
] )( PublicizeConnectionVerify );
