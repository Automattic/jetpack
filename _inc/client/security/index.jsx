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
		return (
			<div>
				<QuerySite />
				<BackupsScan
					{ ...commonProps }
				/>
				<Antispam
					{ ...commonProps }
				/>
				<Protect
					{ ...commonProps }
				/>
				<SSO
					{ ...commonProps }
				/>
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
			isUnavailableInDevMode: module_name => isUnavailableInDevMode( state, module_name )
		}
	}
)( Security );
