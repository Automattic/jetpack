/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import FoldableCard from 'components/foldable-card';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import { translate as __ } from 'i18n-calypso';
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
	getModule as _getModule
} from 'state/modules';
import { ModuleToggle } from 'components/module-toggle';
import { AllModuleSettings } from 'components/module-settings/modules-per-tab-page';
import { isUnavailableInDevMode } from 'state/connection';
import { getSiteAdminUrl, isSitePublic } from 'state/initial-state';

export const Page = ( props ) => {
	let {
		toggleModule,
		isModuleActivated,
		isTogglingModule,
		getModule
	} = props,
		photonDesc = getModule( 'photon' ).description;

	if ( ! props.isSitePublic() ) {
		let makePublic = (
			<p className="jp-form-setting-explanation">
				{ __( 'Your site must be publicly accessible for this feature to work properly. You can make your site public in {{a}}Reading Settings{{/a}}.', {
					components: {
						a: <a href={ props.getSiteAdminUrl() + 'options-reading.php#blog_public' } className="jetpack-js-stop-propagation" />
					}
				} ) }
			</p>
		);
		photonDesc = <span>
			{ photonDesc }
			{ makePublic }
		</span>;
	}

	var cards = [
		[ 'tiled-gallery', getModule( 'tiled-gallery' ).name, getModule( 'tiled-gallery' ).description, getModule( 'tiled-gallery' ).learn_more_button ],
		[ 'photon', getModule( 'photon' ).name, photonDesc, getModule( 'photon' ).learn_more_button ],
		[ 'carousel', getModule( 'carousel' ).name, getModule( 'carousel' ).description, getModule( 'carousel' ).learn_more_button ],
		[ 'widgets', getModule( 'widgets' ).name, getModule( 'widgets' ).description, getModule( 'widgets' ).learn_more_button ],
		[ 'widget-visibility', getModule( 'widget-visibility' ).name, getModule( 'widget-visibility' ).description, getModule( 'widget-visibility' ).learn_more_button ],
		[ 'custom-css', getModule( 'custom-css' ).name, getModule( 'custom-css' ).description, getModule( 'custom-css' ).learn_more_button ],
		[ 'infinite-scroll', getModule( 'infinite-scroll' ).name, getModule( 'infinite-scroll' ).description, getModule( 'infinite-scroll' ).learn_more_button ],
		[ 'minileven', getModule( 'minileven' ).name, getModule( 'minileven' ).description, getModule( 'minileven' ).learn_more_button ]
	].map( ( element ) => {
		var unavailableInDevMode = props.isUnavailableInDevMode( element[0] ),
			toggle = (
				unavailableInDevMode ? __( 'Unavailable in Dev Mode' ) :
					<ModuleToggle slug={ element[0] } activated={ isModuleActivated( element[0] ) }
								toggling={ isTogglingModule( element[0] ) }
								toggleModule={ toggleModule } />
			),
			customClasses = unavailableInDevMode ? 'devmode-disabled' : '';

		return (
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
				{
					isModuleActivated( element[0] ) ?
						<AllModuleSettings module={ getModule( element[0] ) } /> :
						// Render the long_description if module is deactivated
						<div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />
				}
				<div className="jp-module-settings__read-more">
					<Button borderless compact href={ element[3] }><Gridicon icon="help-outline" /><span className="screen-reader-text">{ __( 'Learn More' ) }</span></Button>
				</div>
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
			getModule: ( module_name ) => _getModule( state, module_name ),
			isUnavailableInDevMode: ( module_name ) => isUnavailableInDevMode( state, module_name ),
			getSiteAdminUrl: () => getSiteAdminUrl( state ),
			isSitePublic: () => isSitePublic( state )
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
