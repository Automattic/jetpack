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
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import QuerySite from 'components/data/query-site';
import { isUnavailableInDevMode } from 'state/connection';
import { AllModuleSettings } from 'components/module-settings/modules-per-tab-page';
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
import {
	getSitePlan
} from 'state/site';
import ProStatus from 'pro-status';
import {
	isFetchingPluginsData,
	isPluginActive
} from 'state/site/plugins';

export const SearchResults = ( {
	siteAdminUrl,
	toggleModule,
	isModuleActivated,
	isTogglingModule,
	getModule,
	getModules,
	searchTerm,
	unavailableInDevMode,
	isFetchingPluginsData,
	isPluginActive
	} ) => {
	let modules = getModules(),
		moduleList = [
			[
				'scan',
				__( 'Security Scanning' ),
				__( 'Automatically scan your site for common threats and attacks.' ),
				'https://vaultpress.com/jetpack/',
				'security scan threat attacks pro scanning' // Extra search terms @todo make translatable
			],
			[
				'akismet',
				'Akismet',
				__( 'Keep those spammers away!' ),
				'https://akismet.com/jetpack/',
				'spam security comments pro'
			],
			[
				'backups',
				__( 'Site Backups' ),
				__( 'Keep your site backed up!' ),
				'https://vaultpress.com/jetpack/',
				'backup restore pro security'
			]
		],
		cards;

	forEach( modules, function( m ) {
		'vaultpress' !== m.module ? moduleList.push( [
			m.module,
			getModule( m.module ).name,
			getModule( m.module ).description,
			getModule( m.module ).learn_more_button,
			getModule( m.module ).long_description,
			getModule( m.module ).search_terms,
			getModule( m.module ).additional_search_queries,
			getModule( m.module ).short_description,
			getModule( m.module ).feature.toString()
		] ) : '';
	} );

	cards = moduleList.map( ( element ) => {
		let isPro = 'scan' === element[0] || 'akismet' === element[0] || 'backups' === element[0],
			proProps = {},
			unavailableDevMode = unavailableInDevMode( element[0] ),
			toggle = unavailableDevMode ? __( 'Unavailable in Dev Mode' ) : (
				<ModuleToggle
					slug={ element[0] }
					activated={ isModuleActivated( element[0] ) }
					toggling={ isTogglingModule( element[0] ) }
					toggleModule={ toggleModule }
				/>
			),
			customClasses = unavailableDevMode ? 'devmode-disabled' : '';

		if ( isPro ) {
			proProps = {
				module: element[0],
				configure_url: ''
			};
			toggle = <ProStatus proFeature={ element[0] } />;

			// Add a "pro" button next to the header title
			element[1] = <span>
				{ element[1] }
				<Button
					compact={ true }
					href="#/plans"
				>
					{ __( 'Pro' ) }
				</Button>
			</span>;

			// Set proper .configure_url
			if ( ! isFetchingPluginsData ) {
				if ( 'akismet' === element[0] && isPluginActive( 'akismet/akismet.php' ) ) {
					proProps.configure_url = siteAdminUrl + 'admin.php?page=akismet-key-config';
				} else if ( ( 'scan' === element[0] || 'backups' === element[0] ) && isPluginActive( 'vaultpress/vaultpress.php' ) ) {
					proProps.configure_url = 'https://dashboard.vaultpress.com/';
				}
			}
		}

		if ( 1 === element.length ) {
			return ( <h1>{ element[0] }</h1> );
		}

		return (
			<FoldableCard
				key={ element[0] }
				className={ customClasses }
				header={ element[1] }
				searchTerms={ element.toString().replace( /<(?:.|\n)*?>/gm, '' ) }
				subheader={ element[2] }
				summary={ toggle }
				expandedSummary={ toggle }
				clickableHeaderText={ true }
				onOpen={ () => analytics.tracks.recordEvent( 'jetpack_wpa_settings_card_open',
					{
						card: element[0],
						path: '/search'
					}
				) }
			>
				{
					isModuleActivated( element[0] ) || isPro ?
						<AllModuleSettings module={ isPro ? proProps : getModule( element[0] ) } /> :
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
			<QuerySite />
			<Collection
				filter={ searchTerm() }
				noResultsText={ __( 'No Results Found.' ) }
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

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			isTogglingModule: ( module_name ) => isActivatingModule( state, module_name ) || isDeactivatingModule( state, module_name ),
			getModule: ( module_name ) => _getModule( state, module_name ),
			getModules: () => _getModules( state ),
			searchTerm: () => getSearchTerm( state ),
			sitePlan: () => getSitePlan( state ),
			unavailableInDevMode: ( module_name ) => isUnavailableInDevMode( state, module_name ),
			isFetchingPluginsData: isFetchingPluginsData( state ),
			isPluginActive: ( plugin_slug ) => isPluginActive( state, plugin_slug )
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
)( SearchResults );
