import { getRedirectUrl, JetpackFooter } from '@automattic/jetpack-components';
import { __, _x, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import DevCard from 'components/dev-card';
import analytics from 'lib/analytics';
import React from 'react';
import { connect } from 'react-redux';
import { isInIdentityCrisis, getSiteConnectionStatus } from 'state/connection';
import { canDisplayDevCard, enableDevCard, resetOptions } from 'state/dev-version';
import {
	isDevVersion as _isDevVersion,
	getCurrentVersion,
	userCanManageOptions,
	getSiteAdminUrl,
	isAtomicPlatform,
} from 'state/initial-state';
import onKeyDownCallback from 'utils/onkeydown-callback';

const smoothScroll = () => {
	const jpContentY = document.getElementById( 'jp-navigation' ).offsetTop;
	window.scrollTo( 0, window.scrollY - jpContentY / 1.5 );
	if ( window.scrollY > jpContentY ) {
		window.requestAnimationFrame( smoothScroll );
	}
};

export class Footer extends React.Component {
	static displayName = 'Footer';

	resetOnClick = () => {
		if ( window.confirm( __( 'This will reset all Jetpack options, are you sure?', 'jetpack' ) ) ) {
			this.props.resetOptions();
		}
	};

	trackVersionClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'footer_link',
			link: 'version',
		} );
	};

	trackTermsClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'footer_link',
			link: 'terms',
		} );
	};

	trackAboutClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'footer_link',
			link: 'about',
		} );
	};

	trackPrivacyClick = () => {
		window.requestAnimationFrame( smoothScroll );
		analytics.tracks.recordJetpackClick( {
			target: 'footer_link',
			link: 'privacy',
		} );
	};

	trackModulesClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'footer_link',
			link: 'modules',
		} );
	};

	trackDebugClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'footer_link',
			link: 'debug',
		} );
	};

	render() {
		const classes = classNames( this.props.className, 'jp-footer' );

		const version = this.props.currentVersion;

		const maybeShowReset = () => {
			if ( this.props.isDevVersion && this.props.userCanManageOptions ) {
				return (
					<li className="jp-footer__link-item">
						<a
							role="button"
							tabIndex="0"
							onKeyDown={ onKeyDownCallback( this.resetOnClick ) }
							onClick={ this.resetOnClick }
							className="jp-footer__link"
						>
							{ _x( 'Reset Options (dev only)', 'Navigation item.', 'jetpack' ) }
						</a>
					</li>
				);
			}
			return '';
		};

		const maybeShowModules = () => {
			if ( this.props.siteConnectionStatus && this.props.userCanManageOptions ) {
				return (
					<li className="jp-footer__link-item">
						<a
							onClick={ this.trackModulesClick }
							href={ this.props.siteAdminUrl + 'admin.php?page=jetpack_modules' }
							title={ __(
								'Access the full list of Jetpack modules available on your site.',
								'jetpack'
							) }
							className="jp-footer__link"
						>
							{ _x(
								'Modules',
								'Navigation item. Noun. Links to a list of modules for Jetpack.',
								'jetpack'
							) }
						</a>
					</li>
				);
			}
		};

		const maybeShowDebug = () => {
			if ( this.props.userCanManageOptions ) {
				return (
					<li className="jp-footer__link-item">
						<a
							onClick={ this.trackDebugClick }
							href={ this.props.siteAdminUrl + 'admin.php?page=jetpack-debugger' }
							title={ __( 'Test your site’s compatibility with Jetpack.', 'jetpack' ) }
							className="jp-footer__link"
						>
							{ _x(
								'Debug',
								'Navigation item. Noun. Links to a debugger tool for Jetpack.',
								'jetpack'
							) }
						</a>
					</li>
				);
			}
		};

		const maybeShowDevCardFooterLink = () => {
			if ( this.props.isDevVersion ) {
				return (
					<li className="jp-footer__link-item">
						<a
							role="button"
							tabIndex="0"
							onKeyDown={ onKeyDownCallback( this.props.enableDevCard ) }
							onClick={ this.props.enableDevCard }
							className="jp-footer__link"
						>
							{ _x( 'Dev Tools', 'Navigation item.', 'jetpack' ) }
						</a>
					</li>
				);
			}
			return '';
		};

		const maybeShowDevCard = () => {
			if ( this.props.isDevVersion && this.props.displayDevCard ) {
				return <DevCard />;
			}
		};

		const maybeShowVersionNumber = () => {
			if ( ! this.props.isAtomicPlatform ) {
				return (
					<li className="jp-footer__link-item">
						<a
							onClick={ this.trackVersionClick }
							href={ getRedirectUrl( 'jetpack' ) }
							target="_blank"
							rel="noopener noreferrer"
							className="jp-footer__link"
							title={ __( 'Jetpack version', 'jetpack' ) }
						>
							{ version
								? sprintf(
										/* Translators: placeholder is a version number. */
										__( 'Jetpack version %s', 'jetpack' ),
										version
								  )
								: 'Jetpack' }
						</a>
					</li>
				);
			}
		};

		const aboutPageUrl = this.props.siteConnectionStatus
			? this.props.siteAdminUrl + 'admin.php?page=jetpack_about'
			: getRedirectUrl( 'jetpack' );

		const privacyUrl = this.props.siteConnectionStatus
			? this.props.siteAdminUrl + 'admin.php?page=jetpack#/privacy'
			: getRedirectUrl( 'a8c-privacy' );

		return (
			<div className={ classes }>
				<ul className="jp-footer__links">
					{ maybeShowVersionNumber() }
					<li className="jp-footer__link-item">
						<a
							onClick={ this.trackAboutClick }
							href={ aboutPageUrl }
							className="jp-footer__link"
							title={ __( 'About Jetpack', 'jetpack' ) }
						>
							{ _x( 'About', 'Link to learn more about Jetpack.', 'jetpack' ) }
						</a>
					</li>
					<li className="jp-footer__link-item">
						<a
							onClick={ this.trackTermsClick }
							href={ getRedirectUrl( 'wpcom-tos' ) }
							target="_blank"
							rel="noopener noreferrer"
							title={ __( 'WordPress.com Terms of Service', 'jetpack' ) }
							className="jp-footer__link"
						>
							{ _x( 'Terms', 'Shorthand for Terms of Service.', 'jetpack' ) }
						</a>
					</li>
					<li className="jp-footer__link-item">
						<a
							onClick={ this.trackPrivacyClick }
							href={ privacyUrl }
							rel="noopener noreferrer"
							title={ __( "Automattic's Privacy Policy", 'jetpack' ) }
							className="jp-footer__link"
						>
							{ _x( 'Privacy', 'Shorthand for Privacy Policy.', 'jetpack' ) }
						</a>
					</li>
					{ maybeShowModules() }
					{ maybeShowDebug() }
					{ maybeShowReset() }
					{ maybeShowDevCardFooterLink() }
					{ maybeShowDevCard() }
				</ul>
				<div className="jp-footer__rna-footer">
					<JetpackFooter a8cLogoHref={ aboutPageUrl } />
				</div>
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			currentVersion: getCurrentVersion( state ),
			displayDevCard: canDisplayDevCard( state ),
			isAtomicPlatform: isAtomicPlatform( state ),
			isDevVersion: _isDevVersion( state ),
			isInIdentityCrisis: isInIdentityCrisis( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
			siteConnectionStatus: getSiteConnectionStatus( state ),
			userCanManageOptions: userCanManageOptions( state ),
		};
	},
	dispatch => {
		return {
			resetOptions: () => {
				return dispatch( resetOptions( 'options' ) );
			},
			enableDevCard: () => {
				return dispatch( enableDevCard() );
			},
		};
	}
)( Footer );
