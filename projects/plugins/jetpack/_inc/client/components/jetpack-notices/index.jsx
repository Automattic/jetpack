import { JETPACK_CONTACT_BETA_SUPPORT } from 'constants/urls';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import ConnectionBanner from 'components/connection-banner';
import NoticesList from 'components/global-notices';
import SimpleNotice from 'components/notice';
import NoticeAction from 'components/notice/notice-action.jsx';
import cookie from 'cookie';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import SocialLogo from 'social-logos';
import {
	getSiteConnectionStatus,
	getSiteOfflineMode,
	isConnectionOwner,
	isInIdentityCrisis,
	isCurrentUserLinked,
	isReconnectingSite,
	getConnectUrl as _getConnectUrl,
	hasConnectedOwner,
} from 'state/connection';
import {
	isAtomicSite,
	isDevVersion,
	userCanConnectAccount,
	userCanConnectSite,
	userIsSubscriber,
	getConnectionErrors,
} from 'state/initial-state';
import { getLicensingError, clearLicensingError } from 'state/licensing';
import { getSiteDataErrors } from 'state/site';
import DeprecationNotice from './deprecation-notice';
import DismissableNotices from './dismissable';
import JetpackConnectionErrors from './jetpack-connection-errors';
import PlanConflictWarning from './plan-conflict-warning';
import JetpackStateNotices from './state-notices';

export class DevVersionNotice extends React.Component {
	static displayName = 'DevVersionNotice';

	render() {
		if ( this.props.isDevVersion && ! this.props.userIsSubscriber ) {
			return (
				<SimpleNotice
					showDismiss={ false }
					text={ __( 'You are currently running a development version of Jetpack.', 'jetpack' ) }
				>
					<NoticeAction href={ JETPACK_CONTACT_BETA_SUPPORT } external={ true }>
						{ __( 'Submit Beta feedback', 'jetpack' ) }
					</NoticeAction>
				</SimpleNotice>
			);
		}

		return false;
	}
}

DevVersionNotice.propTypes = {
	isDevVersion: PropTypes.bool.isRequired,
	userIsSubscriber: PropTypes.bool.isRequired,
};

export class OfflineModeNotice extends React.Component {
	static displayName = 'OfflineModeNotice';

	render() {
		if ( this.props.siteConnectionStatus === 'offline' ) {
			const offlineMode = this.props.siteOfflineMode,
				reasons = [];

			if ( offlineMode.filter ) {
				reasons.push( __( 'The jetpack_development_mode filter is active', 'jetpack' ) );
			}
			if ( offlineMode.constant ) {
				reasons.push(
					sprintf(
						/* translators: placeholder is a constant, such as WP_LOCAL_DEV. */
						__( 'The %s constant is defined', 'jetpack' ),
						'JETPACK_DEV_DEBUG'
					)
				);
			}
			if ( offlineMode.wpLocalConstant ) {
				reasons.push(
					sprintf(
						/* translators: placeholder is a constant, such as WP_LOCAL_DEV. */
						__( 'The %s constant is defined', 'jetpack' ),
						'WP_LOCAL_DEV'
					)
				);
			}
			if ( offlineMode.url ) {
				reasons.push(
					__( 'Your site URL is a known local development environment URL', 'jetpack' )
				);
			}

			const text = createInterpolateElement(
				/* translators: reasons is an unordered list of reasons why a site may be in Offline mode. */
				__(
					'Currently in <a>Offline Mode</a> (some features are disabled) because: <reasons/>',
					'jetpack'
				),
				{
					a: (
						<a
							href={ getRedirectUrl( 'jetpack-support-development-mode' ) }
							target="_blank"
							rel="noopener noreferrer"
						/>
					),
					reasons: (
						<ul>
							{ reasons.map( ( reason, i ) => {
								return <li key={ i }>{ reason }</li>;
							} ) }
						</ul>
					),
				}
			);

			return (
				<SimpleNotice showDismiss={ false } status="is-info" text={ text }>
					<NoticeAction href={ getRedirectUrl( 'jetpack-support-development-mode' ) }>
						{ __( 'Learn More', 'jetpack' ) }
					</NoticeAction>
				</SimpleNotice>
			);
		}

		return false;
	}
}

OfflineModeNotice.propTypes = {
	siteConnectionStatus: PropTypes.oneOfType( [ PropTypes.string, PropTypes.bool ] ).isRequired,
	siteOfflineMode: PropTypes.oneOfType( [ PropTypes.bool, PropTypes.object ] ).isRequired,
};

export class UserUnlinked extends React.Component {
	static displayName = 'UserUnlinked';

	render() {
		if ( ! this.props.isLinked && this.props.connectUrl && this.props.siteConnected ) {
			return (
				<div className="jp-unlinked-notice">
					<ConnectionBanner
						title={ __( 'Connect your WordPress.com account', 'jetpack' ) }
						description={ __(
							'Jetpack is powering your site, but to access all of its features you’ll need to connect your account to WordPress.com.',
							'jetpack'
						) }
						callToAction={ __( 'Create account', 'jetpack' ) }
						href={ `${ this.props.connectUrl }&from=unlinked-user-connect` }
						icon={ <SocialLogo icon="wordpress" size={ 24 } /> }
						className="is-jetpack-info"
						from="unlinked-user-connect"
						connectUser={ true }
					/>
				</div>
			);
		}

		return false;
	}
}

UserUnlinked.propTypes = {
	connectUrl: PropTypes.string.isRequired,
	siteConnected: PropTypes.bool.isRequired,
};

class JetpackNotices extends React.Component {
	static displayName = 'JetpackNotices';

	constructor( props ) {
		super( props );

		const cookieParsed = cookie.parse( document.cookie );
		const dismissedNotices = Object.keys( cookieParsed )
			.filter( key => key.startsWith( 'jetpack_deprecate_dismissed' ) )
			.reduce( ( acc, key ) => {
				acc[ key.replace( 'jetpack_deprecate_dismissed[', '' ).replace( /]/g, '' ) ] = '1';
				return acc;
			}, {} );

		this.state = {
			dismissedNotices,
		};
	}

	componentDidMount() {
		const noticeHandlers = {};
		const noticeKeys = []; // Add more notice keys here

		noticeKeys.forEach( noticeKey => {
			noticeHandlers[ noticeKey ] = this.dismissNotice.bind( this, noticeKey );
		} );

		this.setState( { noticeHandlers } );
	}

	dismissNotice = noticeKey => {
		this.setState( prevState => ( {
			dismissedNotices: {
				...prevState.dismissedNotices,
				[ noticeKey ]: '1',
			},
		} ) );

		document.cookie = `jetpack_deprecate_dismissed[${ noticeKey }]=1; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/; Secure; SameSite=None`;
	};

	isNoticeDismissed = noticeKey => {
		return this.state.dismissedNotices[ noticeKey ] === '1';
	};

	render() {
		// Add notices here. Example:
		// const notices = [
		//  {
		//    noticeKey: 'my-xyz-deprecate-feature',
		//    title: __( "Retired feature: Jetpack's XYZ Feature", 'jetpack' ),
		//    message: __( "This feature is being retired and will be removed effective November, 2024. Please use the Classic Theme Helper plugin instead.", 'jetpack' ),
		//    link: getRedirectUrl( 'my-support' ),
		//    linkText: __( 'Learn more', 'jetpack' ),
		//    show: this.props.showXYZNotice && ! this.isNoticeDismissed( 'my-xyz-deprecate-feature' )
		//  }
		// ];
		const notices = [ {} ];
		const siteDataErrors = this.props.siteDataErrors.filter( error =>
			Object.hasOwn( error, 'action' )
		);

		const isUserConnectScreen = this.props.location.pathname.startsWith( '/connect-user' );

		return (
			<div aria-live="polite">
				<NoticesList />
				{ this.props.siteConnectionStatus &&
					this.props.userCanConnectSite &&
					( this.props.connectionErrors.length > 0 || siteDataErrors.length > 0 ) && (
						<JetpackConnectionErrors
							errors={ this.props.connectionErrors.concat( siteDataErrors ) }
							display={ ! this.props.isReconnectingSite }
						/>
					) }
				<JetpackStateNotices />
				<DevVersionNotice
					isDevVersion={ this.props.isDevVersion }
					userIsSubscriber={ this.props.userIsSubscriber }
				/>
				<OfflineModeNotice
					siteConnectionStatus={ this.props.siteConnectionStatus }
					siteOfflineMode={ this.props.siteOfflineMode }
				/>
				<PlanConflictWarning />
				<DismissableNotices />
				{ ! this.props.isReconnectingSite &&
					this.props.userCanConnectAccount &&
					this.props.hasConnectedOwner &&
					! siteDataErrors.length &&
					! this.props.connectionErrors.length &&
					! isUserConnectScreen && (
						<UserUnlinked
							connectUrl={ this.props.connectUrl }
							siteConnected={ true === this.props.siteConnectionStatus }
							isLinked={ this.props.isLinked }
						/>
					) }
				{ ! this.props.siteConnectionStatus && ! this.props.userCanConnectSite && (
					<SimpleNotice
						showDismiss={ false }
						status="is-warning"
						text={ __(
							'This site is not connected to WordPress.com. Please ask the site administrator to connect.',
							'jetpack'
						) }
					/>
				) }
				{ this.props.licensingError && (
					<SimpleNotice
						showDismiss={ true }
						status="is-error"
						text={ this.props.licensingError }
						onDismissClick={ this.props.clearLicensingError }
					/>
				) }

				{ notices.map( ( { noticeKey, message, link, show, title, linkText } ) => (
					<DeprecationNotice
						key={ noticeKey }
						show={ show && ! this.isNoticeDismissed( noticeKey ) }
						noticeKey={ noticeKey }
						// eslint-disable-next-line react/jsx-no-bind
						dismissNotice={ () => this.dismissNotice( noticeKey ) }
						title={ title }
						message={ message }
						link={ link }
						linkText={ linkText }
					/>
				) ) }
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			connectUrl: _getConnectUrl( state ),
			siteConnectionStatus: getSiteConnectionStatus( state ),
			userCanConnectSite: userCanConnectSite( state ),
			userCanConnectAccount: userCanConnectAccount( state ),
			userIsSubscriber: userIsSubscriber( state ),
			isConnectionOwner: isConnectionOwner( state ),
			isLinked: isCurrentUserLinked( state ),
			isDevVersion: isDevVersion( state ),
			isAtomicSite: isAtomicSite( state ),
			siteOfflineMode: getSiteOfflineMode( state ),
			isInIdentityCrisis: isInIdentityCrisis( state ),
			connectionErrors: getConnectionErrors( state ),
			siteDataErrors: getSiteDataErrors( state ),
			isReconnectingSite: isReconnectingSite( state ),
			licensingError: getLicensingError( state ),
			hasConnectedOwner: hasConnectedOwner( state ),
		};
	},
	dispatch => {
		return {
			clearLicensingError: () => {
				return dispatch( clearLicensingError() );
			},
		};
	}
)( withRouter( JetpackNotices ) );
