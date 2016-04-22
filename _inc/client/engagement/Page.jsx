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
	getModule as _getModule
} from 'state/modules';

export const Page = ( { toggleModule, isModuleActivated, isTogglingModule, getModule } ) => {
	/**
	 * Array of modules that directly map to a card for rendering
	 * @type {Array}
	 */
	let cards = [
		[ 'stats', getModule( 'stats' ).name, getModule( 'stats' ).description ],
		[ 'sharedaddy', getModule( 'sharedaddy' ).name, getModule( 'sharedaddy' ).description ],
		[ 'likes', getModule( 'likes' ).name, getModule( 'likes' ).description ],
		[ 'enhanced-distribution', getModule( 'enhanced-distribution' ).name, getModule( 'enhanced-distribution' ).description ],
		[ 'related-posts', getModule( 'related-posts' ).name, getModule( 'related-posts' ).description ],
		[ 'publicize', getModule( 'publicize' ).name, getModule( 'publicize' ).description ],
		[ 'verification-tools', getModule( 'verification-tools' ).name, getModule( 'verification-tools' ).description ],
		[ 'subscriptions', getModule( 'subscriptions' ).name, getModule( 'subscriptions' ).description ],
		[ 'comments', getModule( 'comments' ).name, getModule( 'comments' ).description ],
		[ 'notes', getModule( 'notes' ).name, getModule( 'notes' ).description ]
	].map( ( element ) => (
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
				{ isModuleActivated( element[0] ) ? renderSettings( getModule( element[0] ) ) :
					// Render the long_description if module is deactivated
					<div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />}
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
	switch ( module.name ) {
		case 'stats':
			return renderStatsSettings( module )
		default:
			return ( <div>Settings</div> );
	}
}

function renderStatsSettings( module ) {
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
				if ( activated ) {
					return dispatch( deactivateModule( module_name ) );
				} else {
					return dispatch( activateModule( module_name ) );
				}
			}
		};
	}
)( Page );
