/**
 * External dependencies
 */
import React from 'react';
import JetpackLogo from '../jetpack-logo';
import PropTypes from 'prop-types';
import analytics from '@automattic/jetpack-analytics';

export class Masthead extends React.Component {
	trackLogoClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'masthead',
			path: 'logo',
		} );
	};

	testConnection = () => {
		return this.props.testConnection();
	};

	render() {
		const { sandboxDomain, siteConnectionStatus } = this.props;

		const offlineNotice = siteConnectionStatus === 'offline' ? <code>Offline Mode</code> : '',
			sandboxedBadge = sandboxDomain ? (
				<code
					id="sandbox-domain-badge"
					onClick={ this.testConnection }
					onKeyDown={ this.testConnection }
					role="button"
					tabIndex={ 0 }
					title={ `Sandboxing via ${ sandboxDomain }. Click to test connection.` }
				>
					API Sandboxed
				</code>
			) : (
				''
			);

		return (
			<div className="jp-masthead">
				<div className="jp-masthead__inside-container">
					<div className="jp-masthead__logo-container">
						<a onClick={ this.trackLogoClick } className="jp-masthead__logo-link" href="#dashboard">
							<JetpackLogo className="jetpack-logo__masthead" />
						</a>
						{ offlineNotice }
						{ sandboxedBadge }
					</div>
					{ this.props.children }
				</div>
			</div>
		);
	}
}

Masthead.propTypes = {
	sandboxDomain: PropTypes.string,
	siteConnectionStatus: PropTypes.oneOf( [ 'offline', true, false ] ),
	testConnection: PropTypes.func,
};

export default Masthead;
