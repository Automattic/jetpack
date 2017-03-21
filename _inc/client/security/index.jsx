/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getModule } from 'state/modules';
import { getSettings } from 'state/settings';
import { isDevMode, isUnavailableInDevMode } from 'state/connection';
import { isModuleFound as _isModuleFound } from 'state/search';
import { isPluginActive } from 'state/site/plugins';
import QuerySite from 'components/data/query-site';
import QuerySitePlugins from 'components/data/query-site-plugins';
import QueryAkismetKeyCheck from 'components/data/query-akismet-key-check';
import { BackupsScan } from './backups-scan';
import Antispam from './antispam';
import { Protect } from './protect';
import { SSO } from './sso';

export const Security = React.createClass( {
	displayName: 'SecuritySettings',

	render() {
		const commonProps = {
			settings: this.props.settings,
			getModule: this.props.module,
			isDevMode: this.props.isDevMode,
			isUnavailableInDevMode: this.props.isUnavailableInDevMode
		};

		const found = {
			protect: this.props.isModuleFound( 'protect' ),
			sso: this.props.isModuleFound( 'sso' )
		};

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		if ( ! found.sso && ! found.protect ) {
			return null;
		}

		const backupSettings = (
			<BackupsScan
				{ ...commonProps }
			/>
		);

		let akismetSettings = '';
		if ( this.props.isPluginActive( 'akismet/akismet.php' ) ) {
			akismetSettings = (
				<div>
					<Antispam
						{ ...commonProps }
					/>
					<QueryAkismetKeyCheck />
				</div>
			);
		}
		const protectSettings = (
			<Protect
				{ ...commonProps }
			/>
		);
		const ssoSettings = (
			<SSO
				{ ...commonProps }
			/>
		);
		return (
			<div>
				<QuerySite />
				<QuerySitePlugins />
				{ ( found.protect || found.sso ) && backupSettings }
				{ ( found.protect || found.sso ) && akismetSettings }
				{ found.protect && protectSettings }
				{ found.sso && ssoSettings }
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			module: module_name => getModule( state, module_name ),
			settings: getSettings( state ),
			isDevMode: isDevMode( state ),
			isUnavailableInDevMode: module_name => isUnavailableInDevMode( state, module_name ),
			isModuleFound: ( module_name ) => _isModuleFound( state, module_name ),
			isPluginActive: ( plugin_slug ) => isPluginActive( state, plugin_slug )
		};
	}
)( Security );
