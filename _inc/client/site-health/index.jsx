/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import FoldableCard from 'components/foldable-card';
import { ModuleToggle } from 'components/module-toggle';

/**
 * Internal dependencies
 */
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	deactivateModule,
	isActivatingModule,
	isDeactivatingModule,
	getModule as _getModule
} from 'state/modules';

export const Page = ( { toggleModule, isModuleActivated, isTogglingModule, getModule } ) => {
	var cards = [
		[ 'manage', getModule( 'manage' ).name, getModule( 'manage' ).description, getModule( 'manage' ).learn_more_button ],
		[ 'backups', 'Site Backups', 'Keep your site backed up!' ],
		[ 'akismet', 'Akismet', 'Keep those spammers away!' ]
	].map( ( element ) => {
		var toggle = (
			<ModuleToggle slug={ element[0] } activated={ isModuleActivated( element[0] ) }
				toggling={ isTogglingModule( element[0] ) }
				toggleModule={ toggleModule } />
		);

		if ( 'backups' === element[0] || 'akismet' === element[0] ) {
			toggle = '';
		}

		return (
			<FoldableCard
				header={ element[1] }
				subheader={ element[2] }
				summary={ toggle }
				expandedSummary={ toggle } >
				{ isModuleActivated( element[0] ) || 'akismet' === element[0] || 'backups' === element[0] ? renderSettings( element[0] ) :
					// Render the long_description if module is deactivated
					<div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />
				}
				<a href={ element[3] } target="_blank">Learn More</a>
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
	switch ( module ) {
		case 'akismet':
			return ( <div>Please go to <a href="/wp-admin/admin.php?page=akismet-key-config">Akismet Settings</a> to configure</div> );
		case 'backups':
			return ( <div>Please go to <a href="/wp-admin/admin.php?page=vaultpress">VaultPress Settings</a> to configure</div> );
		default:
			return (
				<div>
					<a href={ module.configure_url }>Link to old settings</a>
				</div>
			);
	}
}

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			isTogglingModule: ( module_name ) =>
				isActivatingModule( state, module_name ) || isDeactivatingModule( state, module_name ),
			getModule: ( module_name ) => _getModule( state, module_name )
		};
	},
	( dispatch ) => {
		return {
			toggleModule: ( module_name, activated ) => {
				return ( activated )
					? dispatch( deactivateModule( module_name ) )
					: dispatch( activateModule( module_name ) );
			}
		};
	}
)( Page );
