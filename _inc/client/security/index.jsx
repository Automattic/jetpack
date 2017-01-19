/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { getModule } from 'state/modules';
import { getSettings } from 'state/settings';
import { isDevMode, isUnavailableInDevMode } from 'state/connection';
import { isModuleFound as _isModuleFound } from 'state/search';
import QuerySite from 'components/data/query-site';
import { BackupsScan } from './backups-scan';
import { Antispam } from './antispam';
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

		let found = {
			protect: this.props.isModuleFound( 'protect' ),
			sso: this.props.isModuleFound( 'sso' )
		};

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return <span />;
		}

		if ( ! found.sso && ! found.protect ) {
			return <span />;
		}

		let backupSettings = (
			<BackupsScan
				{ ...commonProps }
			/>
		);
		let akismetSettings = (
			<Antispam
				{ ...commonProps }
			/>
		);
		let protectSettings = (
			<Protect
				{ ...commonProps }
			/>
		);
		let ssoSettings = (
			<SSO
				{ ...commonProps }
			/>
		);
		return (
			<div>
				<QuerySite />
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
		}
	}
)( Security );
