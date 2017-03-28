/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import FoldableCard from 'components/foldable-card';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import { translate as __ } from 'i18n-calypso';
import includes from 'lodash/includes';
import analytics from 'lib/analytics';

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
	getModules
} from 'state/modules';
import { ModuleToggle } from 'components/module-toggle';
import { AllModuleSettings } from 'components/module-settings/modules-per-tab-page';
import { isUnavailableInDevMode } from 'state/connection';
import { userCanManageModules as _userCanManageModules } from 'state/initial-state';
import QuerySite from 'components/data/query-site';
import {
	getSitePlan,
	isFetchingSiteData
} from 'state/site';
import { getSiteRawUrl } from 'state/initial-state';

export const Writing = ( props ) => {
	let {
		toggleModule,
		isModuleActivated,
		isTogglingModule,
		getModule,
		userCanManageModules,
		sitePlan,
		fetchingSiteData,
		siteRawUrl
	} = props,
		isAdmin = userCanManageModules,
		moduleList = Object.keys( props.moduleList );
	/**
	 * Array of modules that directly map to a card for rendering
	 * @type {Array}
	 */
	let cards = [
		[ 'shortlinks', getModule( 'shortlinks' ).name, getModule( 'shortlinks' ).description, getModule( 'shortlinks' ).learn_more_button ],
		[ 'shortcodes', getModule( 'shortcodes' ).name, getModule( 'shortcodes' ).description, getModule( 'shortcodes' ).learn_more_button ],
		[ 'videopress', getModule( 'videopress' ).name, getModule( 'videopress' ).description, getModule( 'videopress' ).learn_more_button ],
		[ 'contact-form', getModule( 'contact-form' ).name, getModule( 'contact-form' ).description, getModule( 'contact-form' ).learn_more_button ],
		[ 'after-the-deadline', getModule( 'after-the-deadline' ).name, getModule( 'after-the-deadline' ).description, getModule( 'after-the-deadline' ).learn_more_button ],
		[ 'markdown', getModule( 'markdown' ).name, getModule( 'markdown' ).description, getModule( 'markdown' ).learn_more_button ],
		[ 'post-by-email', getModule( 'post-by-email' ).name, getModule( 'post-by-email' ).description, getModule( 'post-by-email' ).learn_more_button ],
		[ 'latex', getModule( 'latex' ).name, getModule( 'latex' ).description, getModule( 'latex' ).learn_more_button ],
		[ 'custom-content-types', getModule( 'custom-content-types' ).name, getModule( 'custom-content-types' ).description, getModule( 'custom-content-types' ).learn_more_button ]
		],
		nonAdminAvailable = [ 'after-the-deadline', 'post-by-email' ];
	// Put modules available to non-admin user at the top of the list.
	if ( ! isAdmin ) {
		let cardsCopy = cards.slice();
		cardsCopy.reverse().forEach( ( element ) => {
			if ( includes( nonAdminAvailable, element[0] ) ) {
				cards.unshift( element );
			}
		} );
		cards = cards.filter( ( element, index ) => cards.indexOf( element ) === index );
	}
	cards = cards.map( ( element, i ) => {
		if ( ! includes( moduleList, element[0] ) ) {
			return null;
		}
		var unavailableInDevMode = props.isUnavailableInDevMode( element[0] ),
			customClasses = unavailableInDevMode ? 'devmode-disabled' : '',
			toggle = '',
			adminAndNonAdmin = isAdmin || includes( nonAdminAvailable, element[0] );
		if ( unavailableInDevMode ) {
			toggle = __( 'Unavailable in Dev Mode' );
		} else if ( isAdmin ) {
			toggle = <ModuleToggle slug={ element[0] }
				activated={ isModuleActivated( element[0] ) }
				toggling={ isTogglingModule( element[0] ) }
				toggleModule={ toggleModule } />;
		}

		if ( 1 === element.length ) {
			return ( <h1 key={ `section-header-${ i }` /* https://fb.me/react-warning-keys */ } >{ element[0] }</h1> );
		}

		var isVideoPress = 'videopress' === element[0];

		if ( isVideoPress ) {
			if ( fetchingSiteData ) {
				toggle = '';
			} else if ( ! sitePlan || 'free_plan' === sitePlan.product_slug || 'jetpack_free' === sitePlan.product_slug || 'personal-bundle' === sitePlan.product_slug || /jetpack_personal*/.test( sitePlan.product_slug ) ) {
				toggle = <Button
					compact={ true }
					primary={ true }
					href={ 'https://jetpack.com/redirect/?source=upgrade-videopress&site=' + siteRawUrl }
				>
					{ __( 'Upgrade' ) }
				</Button>;
			}

			element[1] = <span>
				{ element[1] }
				<Button
					compact={ true }
					href="#/plans"
				>
					{ __( 'Paid' ) }
				</Button>
			</span>;
		}

		return adminAndNonAdmin ? (
			<FoldableCard
				className={ customClasses }
				key={ `module-card_${element[0]}` /* https://fb.me/react-warning-keys */ }
				header={ element[1] }
				subheader={ element[2] }
				summary={ toggle }
				expandedSummary={ toggle }
				clickableHeaderText={ true }
				onOpen={ () => analytics.tracks.recordEvent( 'jetpack_wpa_settings_card_open',
					{
						card: element[0],
						path: props.route.path
					}
				) }
			>
				{ isModuleActivated( element[0] ) || 'scan' === element[0] ?
					<AllModuleSettings module={ getModule( element[0] ) } /> :
					// Render the long_description if module is deactivated
					<div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />
				}
				<div className="jp-module-settings__learn-more">
					<Button borderless compact href={ element[3] }><Gridicon icon="help-outline" /><span className="screen-reader-text">{ __( 'Learn More' ) }</span></Button>
				</div>
			</FoldableCard>
		) : false;
	} );

	return (
		<div>
			<QuerySite />
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
			getModule: ( module_name ) => _getModule( state, module_name ),
			isUnavailableInDevMode: ( module_name ) => isUnavailableInDevMode( state, module_name ),
			userCanManageModules: _userCanManageModules( state ),
			moduleList: getModules( state ),
			sitePlan: getSitePlan( state ),
			fetchingSiteData: isFetchingSiteData( state ),
			siteRawUrl: getSiteRawUrl( state )
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
)( Writing );
