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

		const foundProtect = this.props.isModuleFound( 'protect' ),
			foundSso = this.props.isModuleFound( 'sso' ),
			foundAkismet = this.props.isPluginActive( 'akismet/akismet.php' ),
			foundBackups = this.props.isPluginActive( 'vaultpress/vaultpress.php' );

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		if (
			! foundSso &&
			! foundProtect &&
			! foundAkismet &&
			! foundBackups
		) {
			return null;
		}

		return (
			<div>
				<QuerySite />
				{
					foundBackups && (
						<BackupsScan
							{ ...commonProps }
						/>
					)
				}
				{
					foundAkismet && (
						<div>
							<Antispam
								{ ...commonProps }
							/>
							<QueryAkismetKeyCheck />
						</div>
					)
				}
				{
					foundProtect && (
						<Protect
							{ ...commonProps }
						/>
					)
				}
				{
					foundSso && (
						<SSO
							{ ...commonProps }
						/>
					)
				}
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
