/**
 * Publicize connections verification component.
 *
 * Component to create Ajax request to check
 * all connections. If any connection tests failed,
 * a refresh link may be provided to the user. If
 * no connection tests fail, this component will
 * not render anything.
 */

import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { Component } from '@wordpress/element';
import { SOCIAL_STORE_ID } from '../../social-store';

class PublicizeConnectionVerify extends Component {
	componentDidMount() {
		this.props.refreshConnections();
	}

	render() {
		return null;
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
