import { AdminPage, getRedirectUrl } from '@automattic/jetpack-components';
import { isJetpackSelfHostedSite, isWoASite } from '@automattic/jetpack-script-data';
import { __, _x, sprintf } from '@wordpress/i18n';
import { connect } from 'react-redux';
import DevCard from 'components/dev-card';
import analytics from 'lib/analytics';
import { getSiteConnectionStatus } from 'state/connection';
import { canDisplayDevCard, enableDevCard, resetOptions } from 'state/dev-version';
import {
	isDevVersion as _isDevVersion,
	getCurrentVersion,
	userCanManageOptions,
	getApiNonce,
	getApiRootUrl,
	getSiteAdminUrl,
} from 'state/initial-state';
import onKeyDownCallback from 'utils/onkeydown-callback';
import { HeaderNav } from '../masthead/header-nav';

/**
 * Build footer menu items matching the legacy Footer component.
 *
 * @param {object} props - Component props from Redux.
 * @return {Array} Footer menu items.
 */
function buildFooterMenuItems( props ) {
	const { currentVersion, isDevVersion, siteAdminUrl, siteConnectionStatus, canManageOptions } =
		props;

	const menu = [];

	if ( isJetpackSelfHostedSite() ) {
		menu.push( {
			label: sprintf(
				/* Translators: %s: a version number. */
				__( 'Version %s', 'jetpack' ),
				currentVersion
			),
			href: getRedirectUrl( 'jetpack' ),
			target: '_blank',
			onClick: () => {
				analytics.tracks.recordJetpackClick( {
					target: 'footer_link',
					link: 'version',
				} );
			},
		} );
	}

	if ( siteConnectionStatus && canManageOptions ) {
		menu.push( {
			label: _x(
				'Modules',
				'Navigation item. Noun. Links to a list of modules for Jetpack.',
				'jetpack'
			),
			title: __( 'Access the full list of Jetpack modules available on your site.', 'jetpack' ),
			href: siteAdminUrl + 'admin.php?page=jetpack_modules',
			onClick: () => {
				analytics.tracks.recordJetpackClick( {
					target: 'footer_link',
					link: 'modules',
				} );
			},
		} );
	}

	if ( canManageOptions ) {
		menu.push( {
			label: _x(
				'Debug',
				'Navigation item. Noun. Links to a debugger tool for Jetpack.',
				'jetpack'
			),
			title: __( "Test your site's compatibility with Jetpack.", 'jetpack' ),
			href: siteAdminUrl + 'admin.php?page=jetpack-debugger',
			onClick: () => {
				analytics.tracks.recordJetpackClick( {
					target: 'footer_link',
					link: 'debug',
				} );
			},
		} );
	}

	if ( isDevVersion && canManageOptions ) {
		menu.push( {
			label: _x( 'Reset Options (dev only)', 'Navigation item.', 'jetpack' ),
			role: 'button',
			onKeyDown: onKeyDownCallback( props.doResetOptions ),
			onClick: props.doResetOptions,
		} );
	}

	if ( isDevVersion ) {
		menu.push( {
			label: _x( 'Dev Tools', 'Navigation item.', 'jetpack' ),
			role: 'button',
			onKeyDown: onKeyDownCallback( props.doEnableDevCard ),
			onClick: props.doEnableDevCard,
		} );
	}

	return menu;
}

const SettingsAdminPage = props => {
	const { apiRoot, apiNonce, isDevVersion, displayDevCard, location, tabs, children } = props;

	const footerMenuItems = buildFooterMenuItems( props );

	return (
		<>
			<AdminPage
				className="jp-settings-admin-page"
				title={ __( 'Settings', 'jetpack' ) }
				apiRoot={ apiRoot }
				apiNonce={ apiNonce }
				showBackground={ true }
				tabs={ tabs }
				optionalMenuItems={ footerMenuItems }
				actions={ isWoASite() && <HeaderNav location={ location } /> }
			>
				{ children }
			</AdminPage>
			{ isDevVersion && displayDevCard && <DevCard /> }
		</>
	);
};

export default connect(
	state => ( {
		apiRoot: getApiRootUrl( state ),
		apiNonce: getApiNonce( state ),
		currentVersion: getCurrentVersion( state ),
		isDevVersion: _isDevVersion( state ),
		displayDevCard: canDisplayDevCard( state ),
		canManageOptions: userCanManageOptions( state ),
		siteAdminUrl: getSiteAdminUrl( state ),
		siteConnectionStatus: getSiteConnectionStatus( state ),
	} ),
	dispatch => ( {
		doResetOptions: () => {
			if (
				// eslint-disable-next-line no-alert -- @todo Is there a better dialog we could use?
				window.confirm( __( 'This will reset all Jetpack options, are you sure?', 'jetpack' ) )
			) {
				dispatch( resetOptions( 'options' ) );
			}
		},
		doEnableDevCard: () => {
			dispatch( enableDevCard() );
		},
	} )
)( SettingsAdminPage );
