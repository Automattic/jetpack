/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import FoldableCard from 'components/foldable-card';
import FormToggle from 'components/form/form-toggle';

/**
 * Internal dependencies
 */
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	deactivateModule,
	isActivatingModule,
	isDeactivatingModule
} from 'state/modules';

export const Page = ( { toggleModule, isModuleActivated, isTogglingModule } ) => {
	var cards = [
		[ 'protect', 'Protect', 'Protect your site against malicious login attempts.' ],
		[ 'monitor', 'Downtime Monitoring', 'Receive alerts if your site goes down.' ],
		[ 'scan', 'Security Scanning', 'Automatically scan your site for ommon threats and attacks.' ],
		[ 'sso', 'Single Sign On', 'Securely log into all your sites with the same account.' ]
	].map( ( element ) => {

		return (
			<FoldableCard
				header={ element[1] }
				subheader={ element[2] }
				summary={
					<FormToggle checked={ isModuleActivated( element[0] ) }
						toggling={ isTogglingModule( element[0] ) }
						onChange={ toggleModule.bind( null, element[0], isModuleActivated( element[0] ) ) } />
				}
				expandedSummary={
					<FormToggle checked={ isModuleActivated( element[0] ) }
						toggling={ isTogglingModule( element[0] ) }
						onChange={ toggleModule.bind( null, element[0], isModuleActivated( element[0] ) ) } />
				} >
				settings
			</FoldableCard>
		);

	} );

	return (
		<div>
			{ cards }
		</div>
	);
};

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			isTogglingModule: ( module_name ) =>
				isActivatingModule( state, module_name ) || isDeactivatingModule( state, module_name )
		};
	},
	( dispatch ) => {
		return {
			toggleModule: ( module_name, activated ) => {
				if ( activated ) {
					return dispatch( deactivateModule( module_name ) );
				} else {
					return dispatch( activateModule( module_name ) );
				}
			}
		};
	}
)( Page );
