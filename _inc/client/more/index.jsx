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
		[ 'Appearance & Customization Tools' ],
		[ 'custom-css', getModule( 'custom-css' ).name, getModule( 'custom-css' ).description ],
		[ 'carousel', getModule( 'carousel' ).name, getModule( 'carousel' ).description ],
		[ 'widgets', getModule( 'widgets' ).name, getModule( 'widgets' ).description ],
		[ 'widget-visibility', getModule( 'widget-visibility' ).name, getModule( 'widget-visibility' ).description ],
		[ 'infinite-scroll', getModule( 'infinite-scroll' ).name, getModule( 'infinite-scroll' ).description ],
		[ 'minileven', getModule( 'minileven' ).name, getModule( 'minileven' ).description ],
		[ 'gravatar-hovercards', getModule( 'gravatar-hovercards' ).name, getModule( 'gravatar-hovercards' ).description ],
		[ 'tiled-gallery', getModule( 'tiled-gallery' ).name, getModule( 'tiled-gallery' ).description ],

		[ 'Writing & Content Tools' ],

		[ 'photon', getModule( 'photon' ).name, getModule( 'photon' ).description ],
		[ 'latex', getModule( 'latex' ).name, getModule( 'latex' ).description ],
		[ 'contact-form', getModule( 'contact-form' ).name, getModule( 'contact-form' ).description ],
		[ 'markdown', getModule( 'markdown' ).name, getModule( 'markdown' ).description ],
		[ 'post-by-email', getModule( 'post-by-email' ).name, getModule( 'post-by-email' ).description ],
		[ 'custom-content-types', getModule( 'custom-content-types' ).name, getModule( 'custom-content-types' ).description ],
		[ 'after-the-deadline', getModule( 'after-the-deadline' ).name, getModule( 'after-the-deadline' ).description ],
		[ 'shortlinks', getModule( 'shortlinks' ).name, getModule( 'shortlinks' ).description ],
		[ 'shortcodes', getModule( 'shortcodes' ).name, getModule( 'shortcodes' ).description ],
		[ 'videopress', getModule( 'videopress' ).name, getModule( 'videopress' ).description ],

		[ 'Developer Tools' ],

		[ 'json-api', getModule( 'json-api' ).name, getModule( 'json-api' ).description ],
		[ 'omnisearch', getModule( 'omnisearch' ).name, getModule( 'omnisearch' ).description ]
	].map( ( element ) => {
		var toggle = (
			<ModuleToggle slug={ element[0] } activated={ isModuleActivated( element[0] ) }
				toggling={ isTogglingModule( element[0] ) }
				toggleModule={ toggleModule } />
		);

		if ( 1 === element.length ) {
			return ( <h1>{ element[0] }</h1> );
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

	switch ( module.module ) {
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
			getModule: ( module_name ) => _getModule( state, module_name )
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
