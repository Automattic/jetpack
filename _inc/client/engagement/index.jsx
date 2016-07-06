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
import { EngagementModulesSettings } from 'components/module-options/moduleoptions';
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
			[ 'stats', getModule( 'stats' ).name, getModule( 'stats' ).description, getModule( 'stats' ).learn_more_button ],
			[ 'sharedaddy', getModule( 'sharedaddy' ).name, getModule( 'sharedaddy' ).description, getModule( 'sharedaddy' ).learn_more_button ],
			[ 'publicize', getModule( 'publicize' ).name, getModule( 'publicize' ).description, getModule( 'publicize' ).learn_more_button ],
			[ 'related-posts', getModule( 'related-posts' ).name, getModule( 'related-posts' ).description, getModule( 'related-posts' ).learn_more_button ],
			[ 'comments', getModule( 'comments' ).name, getModule( 'comments' ).description, getModule( 'comments' ).learn_more_button ],
			[ 'likes', getModule( 'likes' ).name, getModule( 'likes' ).description, getModule( 'likes' ).learn_more_button ],
			[ 'subscriptions', getModule( 'subscriptions' ).name, getModule( 'subscriptions' ).description, getModule( 'subscriptions' ).learn_more_button ],
			[ 'gravatar-hovercards', getModule( 'gravatar-hovercards' ).name, getModule( 'gravatar-hovercards' ).description, getModule( 'gravatar-hovercards' ).learn_more_button ],
			[ 'sitemaps', getModule( 'sitemaps' ).name, getModule( 'sitemaps' ).description, getModule( 'sitemaps' ).learn_more_button ],
			[ 'enhanced-distribution', getModule( 'enhanced-distribution' ).name, getModule( 'enhanced-distribution' ).description, getModule( 'enhanced-distribution' ).learn_more_button ],
			[ 'verification-tools', getModule( 'verification-tools' ).name, getModule( 'verification-tools' ).description, getModule( 'verification-tools' ).learn_more_button ],
		];
	} else {
		cards = [
			[ 'publicize', getModule( 'publicize' ).name, getModule( 'publicize' ).description, getModule( 'publicize' ).learn_more_button ],
		];
	}
	cards = cards .map( ( element ) => {
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
					<EngagementModulesSettings module={ getModule( element[0] ) } /> :
					// Render the long_description if module is deactivated
					<div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />
				}
				<p>
					<a href={ element[3] } target="_blank">{ __( 'Learn More' ) }</a>
				</p>
			</FoldableCard>
		);
	});
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