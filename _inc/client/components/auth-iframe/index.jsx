/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { noop } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	isFetchingConnectUrl as _isFetchingConnectUrl,
	getConnectUrl as _getConnectUrl,
	fetchUserConnectionData,
	authorizeUserInPlaceSuccess,
	isAuthorizingUserInPlace,
} from 'state/connection';

import './style.scss';

export class AuthIframe extends React.Component {
	static displayName = 'AuthIframe';

	static propTypes = {
		title: PropTypes.string.isRequired,
		height: PropTypes.string,
		width: PropTypes.string,
		scrollToIframe: PropTypes.bool,
		onAuthorized: PropTypes.func,
	};

	static defaultProps = {
		title: 'Link to WordPress',
		height: '220',
		width: '100%',
		scrollToIframe: true,
		onAuthorized: noop,
	};

	componentDidMount = () => {
		// Scroll to the iframe container
		if ( this.props.scrollToIframe ) {
			window.scrollTo( 0, this.refs.iframeWrap.offsetTop );
		}
		// Add an event listener to identify successful authorization via iframe.
		window.addEventListener( 'message', this.receiveData );
	};

	receiveData = e => {
		if ( e.source === this.refs.iframe.contentWindow && e.data === 'close' ) {
			// Remove listener, our job here is done.
			window.removeEventListener( 'message', this.receiveData );
			// Dispatch successful authorization.
			this.props.authorizeUserInPlaceSuccess();
			// Fetch user connection data after successful authorization to trigger state refresh
			// for linked user.
			this.props.fetchUserConnectionData();
			// Trigger 'onAuthorized' callback, if provided
			this.props.onAuthorized();
		}
	};

	render = () => {
		const src = this.props.connectUrl.replace( 'authorize', 'authorize_iframe' );

		return (
			<div ref="iframeWrap" className="dops-card fade-in">
				{ this.props.fetchingConnectUrl ? (
					<p>{ __( 'Loading…' ) }</p>
				) : (
					<iframe
						ref="iframe"
						title={ this.props.title }
						width={ this.props.width }
						height={ this.props.height }
						src={ src }
					></iframe>
				) }
			</div>
		);
	};
}

export default connect(
	state => {
		return {
			fetchingConnectUrl: _isFetchingConnectUrl( state ),
			connectUrl: _getConnectUrl( state ),
			isAuthorizingInPlace: isAuthorizingUserInPlace( state ),
		};
	},
	dispatch => {
		return {
			fetchUserConnectionData: () => {
				return dispatch( fetchUserConnectionData() );
			},
			authorizeUserInPlaceSuccess: () => {
				return dispatch( authorizeUserInPlaceSuccess() );
			},
		};
	}
)( AuthIframe );
