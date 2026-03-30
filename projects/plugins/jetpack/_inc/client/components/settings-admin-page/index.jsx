import { AdminPage } from '@automattic/jetpack-components';
import { isWoASite } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';
import DevCard from 'components/dev-card';
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
