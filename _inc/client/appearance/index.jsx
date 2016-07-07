/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import FoldableCard from 'components/foldable-card';
import { translate as __ } from 'i18n-calypso';

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
import { ModuleToggle } from 'components/module-toggle';
import { AppearanceModulesSettings } from 'components/module-settings/modules-per-tab-page';
import { isUnavailableInDevMode } from 'state/connection';

export const Page = ( props ) => {
	let {
		toggleModule,
		isModuleActivated,
		isTogglingModule,
		getModule
	} = props;
	var cards = [
		[ 'tiled-gallery', getModule( 'tiled-gallery' ).name, getModule( 'tiled-gallery' ).description, getModule( 'tiled-gallery' ).learn_more_button ],
		[ 'photon', getModule( 'photon' ).name, getModule( 'photon' ).description, getModule( 'photon' ).learn_more_button ],
		[ 'carousel', getModule( 'carousel' ).name, getModule( 'carousel' ).description, getModule( 'carousel' ).learn_more_button ],
		[ 'widgets', getModule( 'widgets' ).name, getModule( 'widgets' ).description, getModule( 'widgets' ).learn_more_button ],
		[ 'widget-visibility', getModule( 'widget-visibility' ).name, getModule( 'widget-visibility' ).description, getModule( 'widget-visibility' ).learn_more_button ],
		[ 'custom-css', getModule( 'custom-css' ).name, getModule( 'custom-css' ).description, getModule( 'custom-css' ).learn_more_button ],
		[ 'infinite-scroll', getModule( 'infinite-scroll' ).name, getModule( 'infinite-scroll' ).description, getModule( 'infinite-scroll' ).learn_more_button ],
		[ 'minileven', getModule( 'minileven' ).name, getModule( 'minileven' ).description, getModule( 'minileven' ).learn_more_button ]
	].map( ( element ) => {
		var unavailableInDevMode = isUnavailableInDevMode( props, element[0] ),
			toggle = (
				unavailableInDevMode ? __( 'Unavailable in Dev Mode' ) :
					<ModuleToggle slug={ element[0] } activated={ isModuleActivated( element[0] ) }
								  toggling={ isTogglingModule( element[0] ) }
								  toggleModule={ toggleModule } />
			),
			customClasses = unavailableInDevMode ? 'devmode-disabled' : '';

		return (
			<FoldableCard className={ customClasses } key={ `module-card_${element[0]}` /* https://fb.me/react-warning-keys */ }
				header={ element[1] }
				subheader={ element[2] }
				summary={ toggle }
				expandedSummary={ toggle }
				clickableHeaderText={ true }
			>
				{ isModuleActivated( element[0] ) ?
					<AppearanceModulesSettings module={ getModule( element[0] ) } /> :
					// Render the long_description if module is deactivated
					<div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />
				}
				<a href={ element[3] } target="_blank">{ __( 'Learn More' ) }</a>
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
