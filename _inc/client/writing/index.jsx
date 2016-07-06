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
import { MoreModulesSettings } from 'components/module-options/moduleoptions';
import { isUnavailableInDevMode } from 'state/connection';

export const Page = ( props ) => {
	let {
		toggleModule,
		isModuleActivated,
		isTogglingModule,
		getModule
	} = props;
	/**
	 * Array of modules that directly map to a card for rendering
	 * @type {Array}
	 */
	let cards;
	if ( window.Initial_State.userData.currentUser.permissions.manage_modules ) {
		cards = [
			[ 'shortlinks', getModule( 'shortlinks' ).name, getModule( 'shortlinks' ).description, getModule( 'shortlinks' ).learn_more_button ],
			[ 'shortcodes', getModule( 'shortcodes' ).name, getModule( 'shortcodes' ).description, getModule( 'shortcodes' ).learn_more_button ],
			[ 'videopress', getModule( 'videopress' ).name, getModule( 'videopress' ).description, getModule( 'videopress' ).learn_more_button ],
			[ 'contact-form', getModule( 'contact-form' ).name, getModule( 'contact-form' ).description, getModule( 'contact-form' ).learn_more_button ],
			[ 'after-the-deadline', getModule( 'after-the-deadline' ).name, getModule( 'after-the-deadline' ).description, getModule( 'after-the-deadline' ).learn_more_button ],
			[ 'markdown', getModule( 'markdown' ).name, getModule( 'markdown' ).description, getModule( 'markdown' ).learn_more_button ],
			[ 'post-by-email', getModule( 'post-by-email' ).name, getModule( 'post-by-email' ).description, getModule( 'post-by-email' ).learn_more_button ],
			[ 'latex', getModule( 'latex' ).name, getModule( 'latex' ).description, getModule( 'latex' ).learn_more_button ],
			[ 'custom-content-types', getModule( 'custom-content-types' ).name, getModule( 'custom-content-types' ).description, getModule( 'custom-content-types' ).learn_more_button ]
		];
	} else {
		cards = [
			[ 'after-the-deadline', getModule( 'after-the-deadline' ).name, getModule( 'after-the-deadline' ).description, getModule( 'after-the-deadline' ).learn_more_button ],
			[ 'post-by-email', getModule( 'post-by-email' ).name, getModule( 'post-by-email' ).description, getModule( 'post-by-email' ).learn_more_button ],
		];
	}
	cards = cards.map( ( element, i ) => {
		var unavailableInDevMode = isUnavailableInDevMode( props, element[0] ),
			toggle = (
				unavailableInDevMode ? __( 'Unavailable in Dev Mode' ) :
					<ModuleToggle slug={ element[0] } activated={ isModuleActivated( element[0] ) }
								  toggling={ isTogglingModule( element[0] ) }
								  toggleModule={ toggleModule } />
			),
			customClasses = unavailableInDevMode ? 'devmode-disabled' : '';

		if ( 1 === element.length ) {
			return ( <h1 key={ `section-header-${ i }` /* https://fb.me/react-warning-keys */ } >{ element[0] }</h1> );
		}

		return (
			<FoldableCard className={ customClasses } key={ `module-card_${element[0]}` /* https://fb.me/react-warning-keys */ }
				header={ element[1] }
				subheader={ element[2] }
				summary={ toggle }
				expandedSummary={ toggle }
				clickableHeaderText={ true }
			>
				{ isModuleActivated( element[0] ) || 'scan' === element[0] ?
					<MoreModulesSettings module={ getModule( element[0] ) } /> :
					// Render the long_description if module is deactivated
					<div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />
				}
				<br/>
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
