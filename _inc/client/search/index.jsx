/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import FoldableCard from 'components/foldable-card';
import { ModuleToggle } from 'components/module-toggle';
import forEach from 'lodash/forEach';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import Collection from 'components/search/search-collection.jsx';
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
	getModule as _getModule,
	getModules as _getModules
} from 'state/modules';
import { getSearchTerm } from 'state/search';
import Engagement from 'engagement/index.jsx';
import Security from 'security/index.jsx';
import Appearance from 'appearance/index.jsx';
import GeneralSettings from 'general-settings/index.jsx';
import Writing from 'writing/index.jsx';

export const Page = ( {
	toggleModule,
	isModuleActivated,
	isTogglingModule,
	getModule,
	getModules,
	searchTerm
	} ) => {
	let modules = getModules(),
		moduleList = [],
		cards,
		toggle;

	forEach( modules, function( m ) {
		moduleList.push( [
			m.module,
			getModule( m.module ).name,
			getModule( m.module ).description,
			getModule( m.module ).long_description,
			getModule( m.module ).learn_more_button,
			getModule( m.module ).search_terms,
			getModule( m.module ).additional_search_queries,
			getModule( m.module ).short_description,
			getModule( m.module ).feature.toString()
		] );
	} );

	cards = moduleList.map( ( element ) => {
		toggle = (
			<ModuleToggle
				slug={ element[0] }
				activated={ isModuleActivated( element[0] ) }
				toggling={ isTogglingModule( element[0] ) }
				toggleModule={ toggleModule }
			/>
		);

		if ( 1 === element.length ) {
			return ( <h1>{ element[0] }</h1> );
		}

		return (
			<FoldableCard
				key={ element[1] }
				header={ element[1] }
				searchTerms={ element.toString() }
				subheader={ element[2] }
				summary={ toggle }
				expandedSummary={ toggle }
				clickableHeaderText={ true }
			>
				{ isModuleActivated( element[0] ) || 'scan' === element[0] ? renderSettings( getModule( element[0] ) ) :
					// Render the long_description if module is deactivated
					<div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />
				}
				<br/>
				<div className="jp-module-settings__read-more">
					<Button borderless compact href={ element[3] }><Gridicon icon="help-outline" /><span className="screen-reader-text">{ __( 'Learn More' ) }</span></Button>
				</div>
			</FoldableCard>
		);
	} );

	return (
		<div>
			<h2>Searching All Modules</h2>
			<Collection
				filter={ searchTerm() }
			>
				{ cards }
			</Collection>
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
			isTogglingModule: ( module_name ) => isActivatingModule( state, module_name ) || isDeactivatingModule( state, module_name ),
			getModule: ( module_name ) => _getModule( state, module_name ),
			getModules: () => _getModules( state ),
			searchTerm: () => getSearchTerm( state )
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
