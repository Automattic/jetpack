import { getRedirectUrl, JetpackFooter, ThemeProvider } from '@automattic/jetpack-components';
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

		const aboutPageUrl = this.props.siteConnectionStatus
			? this.props.siteAdminUrl + 'admin.php?page=jetpack_about'
			: getRedirectUrl( 'jetpack' );

		const menu = [
			{
				label: _x( 'About', 'Link to learn more about Jetpack.', 'jetpack' ),
				title: __( 'About Jetpack', 'jetpack' ),
				href: aboutPageUrl,
				target: this.props.siteConnectionStatus ? '_self' : '_blank',
				onClick: this.trackAboutClick,
			},
			{
				label: _x( 'Privacy', 'Shorthand for Privacy Policy.', 'jetpack' ),
				title: __( "Automattic's Privacy Policy", 'jetpack' ),
				href: this.props.siteConnectionStatus
					? this.props.siteAdminUrl + 'admin.php?page=jetpack#/privacy'
					: getRedirectUrl( 'a8c-privacy' ),
				target: this.props.siteConnectionStatus ? '_self' : '_blank',
				onClick: this.trackPrivacyClick,
			},
			{
				label: _x( 'Terms', 'Shorthand for Terms of Service.', 'jetpack' ),
				title: __( 'WordPress.com Terms of Service', 'jetpack' ),
				href: getRedirectUrl( 'wpcom-tos' ),
				target: '_blank',
				onClick: this.trackTermsClick,
			},
		];
		// Maybe add the version link.
		if ( ! this.props.isAtomicPlatform ) {
			menu.push( {
				label: sprintf(
					/* Translators: placeholder is a version number. */
					__( 'Version %s', 'jetpack' ),
					version
				),
				href: getRedirectUrl( 'jetpack' ),
				target: '_blank',
				onClick: this.trackVersionClick,
			} );
		}
		// Maybe add the modules link.
		if ( this.props.siteConnectionStatus && this.props.userCanManageOptions ) {
			menu.push( {
				label: _x(
					'Modules',
					'Navigation item. Noun. Links to a list of modules for Jetpack.',
					'jetpack'
				),
				title: __( 'Access the full list of Jetpack modules available on your site.', 'jetpack' ),
				href: this.props.siteAdminUrl + 'admin.php?page=jetpack_modules',
				onClick: this.trackModulesClick,
			} );
		}
		// Maybe add the debug link.
		if ( this.props.userCanManageOptions ) {
			menu.push( {
				label: _x(
					'Debug',
					'Navigation item. Noun. Links to a debugger tool for Jetpack.',
					'jetpack'
				),
				title: __( 'Test your site’s compatibility with Jetpack.', 'jetpack' ),
				href: this.props.siteAdminUrl + 'admin.php?page=jetpack-debugger',
				onClick: this.trackDebugClick,
			} );
		}
		// Maybe add the reset options button (dev only).
		if ( this.props.isDevVersion && this.props.userCanManageOptions ) {
			menu.push( {
				label: _x( 'Reset Options (dev only)', 'Navigation item.', 'jetpack' ),
				role: 'button',
				onKeyDown: onKeyDownCallback( this.resetOnClick ),
				onClick: this.resetOnClick,
			} );
		}
		// Maybe add the dev tools button (dev only).
		if ( this.props.isDevVersion ) {
			menu.push( {
				label: _x( 'Dev Tools', 'Navigation item.', 'jetpack' ),
				role: 'button',
				onKeyDown: onKeyDownCallback( this.props.enableDevCard ),
				onClick: this.props.enableDevCard,
			} );
		}

		return (
			<ThemeProvider>
				<div className={ classNames( 'jp-footer', classes ) }>
					<div className="jp-footer__container">
						<JetpackFooter
							menu={ menu }
							a8cLogoHref={ aboutPageUrl }
							moduleNameHref={ getRedirectUrl( 'jetpack' ) }
						/>
					</div>
					{ this.props.isDevVersion && this.props.displayDevCard && <DevCard /> }
				</div>
			</ThemeProvider>
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
