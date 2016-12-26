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
import QuerySite from 'components/data/query-site';
import { BackupsScan } from './backups-scan';

export const Security = React.createClass( {
	displayName: 'SecuritySettings',

	render() {
		return (
			<div>
				<QuerySite />
				<BackupsScan
					settings={ this.props.settings }
					getModule={ this.props.module }
				/>
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			module: ( module_name ) => getModule( state, module_name ),
			settings: getSettings( state )
		}
	}
)( Security );
