/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	isActivatingModule,
	isDeactivatingModule,
	getModule as _getModule,
	getModules
} from 'state/modules';
import { getSettings as _getSettings } from 'state/settings';
import { isUnavailableInDevMode } from 'state/connection';
import { userCanManageModules as _userCanManageModules } from 'state/initial-state';
import { Composing } from './composing';

export const Writing = React.createClass( {
	displayName: 'WritingSettings',

	render() {
		return (
			<div>
				<QuerySite />
				<Composing
					settings={ this.props.getSettings() }
					getModule={ this.props.getModule }
				/>
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			getModule: ( module_name ) => _getModule( state, module_name ),
			getSettings: () => _getSettings( state ),
			isUnavailableInDevMode: ( module_name ) => isUnavailableInDevMode( state, module_name ),
			userCanManageModules: _userCanManageModules( state ),
			moduleList: getModules( state ),
			sitePlan: getSitePlan( state ),
			fetchingSiteData: isFetchingSiteData( state ),
			siteRawUrl: getSiteRawUrl( state )
		};
	},
	( dispatch ) => {
		return {};
	}
)( Writing );
