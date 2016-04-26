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
	isDeactivatingModule,
	getModule
} from 'state/modules';

export const Page = ( { toggleModule, isModuleActivated, isTogglingModule, getModule } ) => {
	var cards = [
		[ 'protect', getModule( 'protect' ).name, getModule( 'protect' ).description ],
		[ 'monitor', getModule( 'monitor' ).name, getModule( 'monitor' ).description ],
		[ 'scan', 'Security Scanning', 'Automatically scan your site for common threats and attacks.' ],
		[ 'sso',  getModule( 'sso' ).name, getModule( 'sso' ).description ]
	].map( ( element ) => {
		var toggle = (
			<FormToggle checked={ isModuleActivated( element[0] ) }
				toggling={ isTogglingModule( element[0] ) }
				onChange={ toggleModule.bind( null, element[0], isModuleActivated( element[0] ) ) } />
		);

		if ( 'scan' === element[0] ) {
			toggle = '';
		}

		return (
			<FoldableCard
				header={ element[1] }
				subheader={ element[2] }
				summary={ toggle }
				expandedSummary={ toggle } >
				{ isModuleActivated( element[0] ) || 'scan' === element[0] ? renderSettings( getModule( element[0] ) ) :
					// Render the long_description if module is deactivated
					<div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />
				}
			</FoldableCard>
		);

	} );

	return (
		<div>
			{ cards }
		</div>
	);
};

function renderLongDescription( module ) {
	// Rationale behind returning an object and not just the string
	// https://facebook.github.io/react/tips/dangerously-set-inner-html.html
	return { __html: module.long_description };
}

function renderSettings( module ) {

	// If there is no module with that slug, it must be the Scan module
	module.module = module.module || 'scan';

	switch ( module.module ) {
		case 'scan':
			return ( <div>You can see the information about security scanning in the "At a Glance" section.</div> );
		default:
			return ( <div>Settings</div> );
	}
}

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			isTogglingModule: ( module_name ) =>
				isActivatingModule( state, module_name ) || isDeactivatingModule( state, module_name ),
			getModule: ( module_name ) => getModule( state, module_name )
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
