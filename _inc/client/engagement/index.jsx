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
	/**
	 * Array of modules that directly map to a card for rendering
	 * @type {Array}
	 */
	let cards = [
		[ 'stats', getModule( 'stats' ).name, getModule( 'stats' ).description, getModule( 'stats' ).learn_more_button ],
		[ 'sharedaddy', getModule( 'sharedaddy' ).name, getModule( 'sharedaddy' ).description, getModule( 'sharedaddy' ).learn_more_button ],
		[ 'likes', getModule( 'likes' ).name, getModule( 'likes' ).description, getModule( 'likes' ).learn_more_button ],
		[ 'enhanced-distribution', getModule( 'enhanced-distribution' ).name, getModule( 'enhanced-distribution' ).description, getModule( 'enhanced-distribution' ).learn_more_button ],
		[ 'related-posts', getModule( 'related-posts' ).name, getModule( 'related-posts' ).description, getModule( 'related-posts' ).learn_more_button ],
		[ 'publicize', getModule( 'publicize' ).name, getModule( 'publicize' ).description, getModule( 'publicize' ).learn_more_button ],
		[ 'verification-tools', getModule( 'verification-tools' ).name, getModule( 'verification-tools' ).description, getModule( 'verification-tools' ).learn_more_button ],
		[ 'subscriptions', getModule( 'subscriptions' ).name, getModule( 'subscriptions' ).description, getModule( 'subscriptions' ).learn_more_button ],
		[ 'comments', getModule( 'comments' ).name, getModule( 'comments' ).description, getModule( 'comments' ).learn_more_button ],
		[ 'notes', getModule( 'notes' ).name, getModule( 'notes' ).description, getModule( 'notes' ).learn_more_button ]
	].map( ( element ) => (
		<FoldableCard
			header={ element[1] }
			subheader={ element[2] }
			summary={
				<ModuleToggle slug={ element[0] } activated={ isModuleActivated( element[0] ) }
					toggling={ isTogglingModule( element[0] ) }
					toggleModule={ toggleModule } />
			}
			expandedSummary={
				<ModuleToggle slug={ element[0] } activated={ isModuleActivated( element[0] ) }
					toggling={ isTogglingModule( element[0] ) }
					toggleModule={ toggleModule } />
			} >
				{ isModuleActivated( element[0] ) ? renderSettings( getModule( element[0] ) ) :
					// Render the long_description if module is deactivated
					<div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />
				}
			<br/>
			<a href={ element[3] } target="_blank">Learm More</a>
		</FoldableCard>
	) );
	return (
		<div>
			{ cards }
		</div>
	);
}

function renderLongDescription( module ) {
	// Rationale behind returning an object and not just the string
	// https://facebook.github.io/react/tips/dangerously-set-inner-html.html
	return { __html: module.long_description };
}

function renderSettings( module ) {
	switch ( module.module ) {
		case 'stats':
			return(
				<div>
					{ renderStatsSettings( module ) }
					<a href={ module.configure_url }>Link to old settings</a>
				</div>
			);

		default:
			return (
				<div>
					<a href={ module.configure_url }>Link to old settings</a>
				</div>
			);
	}
}

function renderStatsSettings() {
	return (
		<div>Stats Settings</div>
	);
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
