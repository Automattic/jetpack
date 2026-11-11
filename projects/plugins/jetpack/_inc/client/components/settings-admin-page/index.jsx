import { AdminPage } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';
import { useLocation } from 'react-router';
import DevCard from 'components/dev-card';
import { canDisplayDevCard, enableDevCard, resetOptions } from 'state/dev-version';
import {
	isDevVersion as _isDevVersion,
	getCurrentVersion,
	userCanManageOptions,
	userCanManageModules,
	getApiNonce,
	getApiRootUrl,
	getSiteAdminUrl,
} from 'state/initial-state';
import { isModuleActivated } from 'state/modules';
import onKeyDownCallback from 'utils/onkeydown-callback';

/**
 * Build footer menu items matching the legacy Footer component.
 *
 * @param {object} props - Component props from Redux.
 * @return {Array} Footer menu items.
 */
function buildFooterMenuItems( props ) {
	const { isDevVersion, canManageOptions } = props;

	const menu = [];

	if ( isDevVersion && canManageOptions ) {
		menu.push( {
			label: 'Reset options (devs)',
			role: 'button',
			onKeyDown: onKeyDownCallback( props.doResetOptions ),
			onClick: props.doResetOptions,
		} );
	}

	if ( isDevVersion ) {
		menu.push( {
			label: 'Tools (devs)',
			role: 'button',
			onKeyDown: onKeyDownCallback( props.doEnableDevCard ),
			onClick: props.doEnableDevCard,
		} );
	}

	return menu;
}

/**
 * What the tab at `pathname` is for, shown under the page title.
 *
 * @param {string} pathname - Router path of the active tab.
 * @return {string|undefined} Subtitle.
 */
function getSubTitle( pathname ) {
	switch ( pathname ) {
		case '/settings':
		case '/security':
			return __(
				'Your site is protected by Jetpack. You’ll be notified if anything needs attention.',
				'jetpack',
				/* dummy arg to avoid bad minification */ 0
			);
		case '/performance':
			return __(
				'Load pages faster, optimize images, and speed up your visitors’ experience.',
				'jetpack'
			);
		case '/writing':
			return __(
				'Compose content the way you want to and streamline your publishing experience.',
				'jetpack'
			);
		case '/sharing':
			return __(
				'Share your content to social media, reaching new audiences and increasing engagement.',
				'jetpack'
			);
		case '/discussion':
			return __( 'Manage advanced comment settings.', 'jetpack' );
		case '/traffic':
			return __(
				'Maximize your site’s visibility in search engines and view traffic patterns in real time.',
				'jetpack'
			);
		case '/reader':
			return __(
				'Discover and follow your favorite sites with the WordPress.com Reader.',
				'jetpack',
				/* dummy arg to avoid bad minification */ 0
			);
		case '/earn':
			return __(
				'Explore tools to earn money with your site.',
				'jetpack',
				/* dummy arg to avoid bad minification */ 0
			);
	}
}

/**
 * The tab whose sections render at `pathname`.
 *
 * @param {string}   pathname         - Router path.
 * @param {boolean}  canManageModules - Whether the user can manage modules.
 * @param {Function} isModuleActive   - Whether a module is active.
 * @return {string|undefined} Tab path.
 */
function getActiveTab( pathname, canManageModules, isModuleActive ) {
	// Mirrors settings/index.jsx: without module access, `/settings` shows Sharing or Writing.
	if ( '/settings' !== pathname || canManageModules ) {
		return pathname;
	}
	if ( isModuleActive( 'publicize' ) ) {
		return '/sharing';
	}
	if ( isModuleActive( 'post-by-email' ) ) {
		return '/writing';
	}
}

const SettingsAdminPage = props => {
	const {
		apiRoot,
		apiNonce,
		isDevVersion,
		displayDevCard,
		tabs,
		children,
		canManageModules,
		isModuleActive,
	} = props;
	const { pathname, search } = useLocation();
	// Search results span every tab, so no single tab's description applies.
	const isSearching = !! new URLSearchParams( search ).get( 'term' );

	const footerMenuItems = buildFooterMenuItems( props );

	return (
		<>
			<AdminPage
				className="jp-settings-admin-page"
				title={ __( 'Settings', 'jetpack' ) }
				subTitle={
					isSearching
						? undefined
						: getSubTitle( getActiveTab( pathname, canManageModules, isModuleActive ) )
				}
				apiRoot={ apiRoot }
				apiNonce={ apiNonce }
				showBackground={ true }
				tabs={ tabs }
				optionalMenuItems={ footerMenuItems }
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
		canManageModules: userCanManageModules( state ),
		isModuleActive: name => isModuleActivated( state, name ),
		siteAdminUrl: getSiteAdminUrl( state ),
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
