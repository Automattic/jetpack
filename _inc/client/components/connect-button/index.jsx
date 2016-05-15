/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';

/**
 * Internal dependencies
 */
import {
	getSiteConnectionStatus as _getSiteConnectionStatus,
	disconnectSite,
	isDisconnectingSite as _isDisconnectingSite,
	isFetchingConnectUrl as _isFetchingConnectUrl,
	getConnectUrl as _getConnectUrl
} from 'state/connection';
import QueryConnectionStatus from 'components/data/query-connection-status';
import { getConnectUrl } from 'state/initial-state';
import QueryConnectUrl  from 'components/data/query-connect-url';

const ConnectButton = React.createClass( {
	displayName: 'ConnectButton',

	renderContent: function() {
		const fetchingUrl = this.props.fetchingConnectUrl( this.props );
		const disconnecting = this.props.isDisconnecting( this.props );

		if ( this.props.isSiteConnected( this.props ) ) {
			return(
				<Button
					onClick={ this.props.disconnectSite }
				    disabled={ disconnecting }
				>
					Disconnect site from WordPress.com
				</Button>
			);
		}
		console.log( this.props.connectUrl( this.props ) );

		return(
			<Button
				className="is-primary jp-jetpack-connect__button"
				href={ this.props.connectUrl( this.props ) }
				disabled={ fetchingUrl }
			>
				Connect to WordPress.com
			</Button>
		);
	},

	render() {
		return (
			<div>
				<QueryConnectionStatus />
				<QueryConnectUrl />
				{ this.renderContent() }
			</div>
		);
	}
} );

export default connect(
	state => {
		return {
			isSiteConnected: () => _getSiteConnectionStatus( state ),
			isDisconnecting: () => _isDisconnectingSite( state ),
			fetchingConnectUrl: () => _isFetchingConnectUrl( state ),
			connectUrl: () => _getConnectUrl( state )
		};
	},
	( dispatch ) => {
		return {
			disconnectSite: () => {
				return dispatch( disconnectSite() );
			}
		};
	}
)( ConnectButton );
