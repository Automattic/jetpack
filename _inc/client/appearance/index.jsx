/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import FoldableCard from 'components/foldable-card';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import Popover from 'components/popover';
import Tooltip from 'components/tooltip';
import { translate as __ } from 'i18n-calypso';
import includes from 'lodash/includes';
import analytics from 'lib/analytics';
import ExternalLink from 'components/external-link';

/**
 * Internal dependencies
 */
import QuerySite from 'components/data/query-site';
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
import {
	userCanManageModules,
	getThemeData
} from 'state/initial-state';
import Settings from 'components/settings';

export const Page = React.createClass( {
	getInitialState() {
		return { showPopover: false };
	},

	toggleInfo: function(){
		this.setState( { showPopover: ! this.state.showPopover } );
	},

	render() {
		let {
				toggleModule,
				isModuleActivated,
				isTogglingModule,
				getModule
			} = this.props,
			isAdmin = this.props.userCanManageModules,
			infiniteScrollDesc = getModule( 'infinite-scroll' ).description,
			noInfiniteScrollSupport = ! this.props.themeData.support.infiniteScroll,
			moduleList = Object.keys( this.props.moduleList );

		var cards = [
			[ 'tiled-gallery', getModule( 'tiled-gallery' ).name, getModule( 'tiled-gallery' ).description, getModule( 'tiled-gallery' ).learn_more_button ],
			[ 'photon', getModule( 'photon' ).name, getModule( 'photon' ).description, getModule( 'photon' ).learn_more_button ],
			[ 'carousel', getModule( 'carousel' ).name, getModule( 'carousel' ).description, getModule( 'carousel' ).learn_more_button ],
			[ 'widgets', getModule( 'widgets' ).name, getModule( 'widgets' ).description, getModule( 'widgets' ).learn_more_button ],
			[ 'widget-visibility', getModule( 'widget-visibility' ).name, getModule( 'widget-visibility' ).description, getModule( 'widget-visibility' ).learn_more_button ],
			[ 'custom-css', getModule( 'custom-css' ).name, getModule( 'custom-css' ).description, getModule( 'custom-css' ).learn_more_button ],
			[ 'infinite-scroll', getModule( 'infinite-scroll' ).name, infiniteScrollDesc, getModule( 'infinite-scroll' ).learn_more_button ],
			[ 'minileven', getModule( 'minileven' ).name, getModule( 'minileven' ).description, getModule( 'minileven' ).learn_more_button ]
		].map( ( element ) => {
			if ( ! includes( moduleList, element[0] ) ) {
				return null;
			}
			var unavailableInDevMode = this.props.isUnavailableInDevMode( element[0] ),
				toggle = (
					unavailableInDevMode ? __( 'Unavailable in Dev Mode' ) :
						<ModuleToggle slug={ element[0] } activated={ isModuleActivated( element[0] ) }
									  toggling={ isTogglingModule( element[0] ) }
									  toggleModule={ toggleModule } />
				),
				toggleExpanded = toggle,
				customClasses = unavailableInDevMode ? 'devmode-disabled' : '';

			let moduleDescription = isModuleActivated( element[0] ) ?
				<AllModuleSettings module={ getModule( element[ 0 ] ) } /> :
				// Render the long_description if module is deactivated
				<div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />;

			let learnMore = (
				<div className="jp-module-settings__learn-more">
					<Button borderless compact href={ element[3] }><Gridicon icon="help-outline" /><span className="screen-reader-text">{ __( 'Learn More' ) }</span></Button>
				</div>
			);

			if ( 'infinite-scroll' === element[0] && noInfiniteScrollSupport ) {
				let tooltipRef = element[0] + '_button';
				toggle = (
					<Button borderless compact onClick={ this.toggleInfo } ref={ tooltipRef } className="jp-info__button">
						<Gridicon icon="info-outline" size={ 18 }/><span className="screen-reader-text">{ __( 'Learn More' ) }</span>
						<Popover context={ this.refs && this.refs[ tooltipRef ] }
								 isVisible={ this.state.showPopover }
								 onClose={ () => {} }
								 className="jp-info__tooltip"
								 id={ 'popover__' + element[0] }
								 position="bottom">
							<ExternalLink icon={ true } iconSize={ 16 } href={ element[3] } target="_blank" onClick={ () => {
								this.setState( { showPopover: false } );
							} }>
								{
									__( 'Theme support required.' )
								}
							</ExternalLink>
						</Popover>
					</Button>
				);
				toggleExpanded = '';
				moduleDescription = '';
				learnMore = '';
				customClasses += ' jp-card-no-expand';
			}

			let componentProps = {
				className          : customClasses,
				key                : `module-card_${element[0]}` /* https://fb.me/react-warning-keys */,
				header             : element[1],
				subheader          : element[2],
				summary            : toggle,
				expandedSummary    : toggleExpanded,
				clickableHeaderText: true,
				onOpen             : () => analytics.tracks.recordEvent( 'jetpack_wpa_settings_card_open',
					{
						card: element[0],
						path: this.props.route.path
					}
				)
			};

			// If there are no description or learn more to render, don't render children.
			// This is in cases like when a theme doesn't support Infinite Scroll. We don't
			// render the children so the arrow pointing downwards isn't rendered.
			return '' !== moduleDescription || '' !== learnMore
				? <FoldableCard { ...componentProps } >{ moduleDescription }{ learnMore }</FoldableCard>
				: <FoldableCard { ...componentProps } ></FoldableCard>
				;
		} );

		return (
			<div>
				<QuerySite />
				{ cards }

				<FoldableCard
					header={ __( 'Holiday Snow' ) }
					subheader={ __( 'Show falling snow in the holiday period.' ) }
					clickableHeaderText={ true }
					disabled={ ! isAdmin }
					summary={ isAdmin ? <Settings slug="snow" /> : '' }
					expandedSummary={ isAdmin ? <Settings slug="snow" /> : '' }
					onOpen={ () => analytics.tracks.recordEvent( 'jetpack_wpa_settings_card_open',
					{
						card: 'holiday_snow',
						path: this.props.route.path
					}
				) }
				>
				<span className="jp-form-setting-explanation">
					{ __( 'Show falling snow on my blog from Dec 1st until Jan 4th.' ) }
				</span>
				</FoldableCard>
			</div>
		)
	}
} );

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
			userCanManageModules: userCanManageModules( state ),
			moduleList: getModules( state ),
			themeData: getThemeData( state )
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
