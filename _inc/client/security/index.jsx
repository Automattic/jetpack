/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import QuerySite from 'components/data/query-site';
import BackupsScan from './backups-scan';
import Antispam from './antispam';
import Protect from './protect';
import SSO from './sso';

export const Security = React.createClass( {
	displayName: 'SecuritySettings',

	render() {
		return (
			<div>
				<QuerySite />
				<BackupsScan />
				<Antispam />
				<Protect />
				<SSO />
			</div>
		);
	}
} );
