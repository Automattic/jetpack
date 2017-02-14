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
import ProStatus from 'pro-status';
import { ModuleToggle } from 'components/module-toggle';
import { AllModuleSettings } from 'components/module-settings/modules-per-tab-page';
import { isUnavailableInDevMode } from 'state/connection';
import {
	getSiteAdminUrl,
	getSiteRawUrl,
	isSitePublic,
	getLastPostUrl,
	userCanManageModules as _userCanManageModules
} from 'state/initial-state';
import { getSitePlan } from 'state/site';
import QuerySite from 'components/data/query-site';
import ExternalLink from 'components/external-link';

export const Engagement = ( props ) => {
	let {
		toggleModule,
		isModuleActivated,
		isTogglingModule,
		getModule
	} = props,
		isAdmin = props.userCanManageModules,
		sitemapsDesc = getModule( 'sitemaps' ).description,
		moduleList = Object.keys( props.moduleList );

	if ( ! props.isSitePublic ) {
		sitemapsDesc = <span>
			{ sitemapsDesc }
			{ <p className="jp-form-setting-explanation">
				{ __( 'Your site must be accessible by search engines for this feature to work properly. You can change this in {{a}}Reading Settings{{/a}}.', {
					components: {
						a: <a href={ props.siteAdminUrl + 'options-reading.php#blog_public' } className="jetpack-js-stop-propagation" />
					}
				} ) }
			</p> }
		</span>;
	}

	/**
	 * Array of modules that directly map to a card for rendering
	 * @type {Array}
	 */
	let cards = [
		[ 'seo-tools', getModule( 'seo-tools' ).name, getModule( 'seo-tools' ).description, getModule( 'seo-tools' ).learn_more_button ],
		[ 'wordads', getModule( 'wordads' ).name, getModule( 'wordads' ).description, getModule( 'wordads' ).learn_more_button ],
		[ 'google-analytics', getModule( 'google-analytics' ).name, getModule( 'google-analytics' ).description, getModule( 'google-analytics' ).learn_more_button ],
		[ 'stats', getModule( 'stats' ).name, getModule( 'stats' ).description, getModule( 'stats' ).learn_more_button ],
		[ 'sharedaddy', getModule( 'sharedaddy' ).name, getModule( 'sharedaddy' ).description, getModule( 'sharedaddy' ).learn_more_button ],
		[ 'publicize', getModule( 'publicize' ).name, getModule( 'publicize' ).description, getModule( 'publicize' ).learn_more_button ],
		[ 'related-posts', getModule( 'related-posts' ).name, getModule( 'related-posts' ).description, getModule( 'related-posts' ).learn_more_button ],
		[ 'comments', getModule( 'comments' ).name, getModule( 'comments' ).description, getModule( 'comments' ).learn_more_button ],
		[ 'likes', getModule( 'likes' ).name, getModule( 'likes' ).description, getModule( 'likes' ).learn_more_button ],
		[ 'subscriptions', getModule( 'subscriptions' ).name, getModule( 'subscriptions' ).description, getModule( 'subscriptions' ).learn_more_button ],
		[ 'gravatar-hovercards', getModule( 'gravatar-hovercards' ).name, getModule( 'gravatar-hovercards' ).description, getModule( 'gravatar-hovercards' ).learn_more_button ],
		[ 'sitemaps', getModule( 'sitemaps' ).name, sitemapsDesc, getModule( 'sitemaps' ).learn_more_button ],
		[ 'enhanced-distribution', getModule( 'enhanced-distribution' ).name, getModule( 'enhanced-distribution' ).description, getModule( 'enhanced-distribution' ).learn_more_button ],
		[ 'verification-tools', getModule( 'verification-tools' ).name, getModule( 'verification-tools' ).description, getModule( 'verification-tools' ).learn_more_button ],
	],
		nonAdminAvailable = [ 'publicize' ];
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
	cards = cards.map( ( element ) => {
		if ( ! includes( moduleList, element[0] ) ) {
			return null;
		}

		let unavailableInDevMode = props.isUnavailableInDevMode( element[0] ),
			customClasses = unavailableInDevMode ? 'devmode-disabled' : '',
			toggle = '',
			adminAndNonAdmin = isAdmin || includes( nonAdminAvailable, element[0] ),
			isPro = includes( [ 'seo-tools', 'wordads', 'google-analytics' ], element[0] ),
			proProps = {
				module: element[0],
				configure_url: ''
			},
			isModuleActive = isModuleActivated( element[0] ),
			planLoaded = 'undefined' !== typeof props.sitePlan.product_slug,
			hasBusiness = false,
			hasPremiumOrBusiness = false,
			wordAdsSubHeader = element[2];

		hasBusiness =
			planLoaded &&
			( props.sitePlan.product_slug === 'jetpack_business' ||
				props.sitePlan.product_slug === 'jetpack_business_monthly' );

		hasPremiumOrBusiness =
			planLoaded &&
			( props.sitePlan.product_slug === 'jetpack_premium' ||
				props.sitePlan.product_slug === 'jetpack_premium_monthly' ||
				props.sitePlan.product_slug === 'jetpack_business' ||
				props.sitePlan.product_slug === 'jetpack_business_monthly' );

		if ( unavailableInDevMode ) {
			toggle = __( 'Unavailable in Dev Mode' );
		} else if ( isAdmin ) {
			if ( ( 'seo-tools' === element[0] && ! hasBusiness ) ||
					( 'google-analytics' === element[0] && ! hasBusiness ) ||
					( 'wordads' === element[0] && ! hasPremiumOrBusiness ) ) {
				toggle = <ProStatus proFeature={ element[0] } />;
			} else {
				toggle =
					<ModuleToggle
						slug={ element[0] }
						activated={ isModuleActive }
						toggling={ isTogglingModule( element[0] ) }
						toggleModule={ toggleModule } />;

				// Add text about TOS if inactive
				if ( 'wordads' === element[0] && ! isModuleActive ) {
					wordAdsSubHeader = <WordAdsSubHeaderTos subheader={ element[2] } />
				}
			}

			if ( element[0] === 'google-analytics' && ! hasBusiness ) {
				isModuleActive = false;
			}

			if ( isPro ) {
				// Add a "pro" button next to the header title
				element[1] =
					<span>
						{ element[1] }
						<Button compact={ true } href="#/plans">
							{ __( 'Paid' ) }
						</Button>
					</span>;
			}
		}

		let lastPostUrl = 'related-posts' === element[0]
			? { lastPostUrl: props.lastPostUrl }
			: '';
		let moduleDescription = isModuleActive ?
			<AllModuleSettings module={ isPro ? proProps : getModule( element[ 0 ] ) } { ...lastPostUrl } /> :
			// Render the long_description if module is deactivated
			<div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />;

		if ( element[0] === 'seo-tools' ) {
			if ( 'undefined' === typeof props.sitePlan.product_slug && ! unavailableInDevMode ) {
				proProps.configure_url = 'checking';
			} else if ( props.sitePlan.product_slug === 'jetpack_business' ) {
				proProps.configure_url = isModuleActive
					? 'https://wordpress.com/settings/seo/' + props.siteRawUrl
					: 'inactive';
			}

			moduleDescription = <AllModuleSettings module={ proProps } />;
		} else if ( element[0] === 'google-analytics' ) {
			proProps.configure_url = isModuleActive
				? 'https://wordpress.com/settings/analytics/' + props.siteRawUrl
				: 'inactive';

			moduleDescription = <AllModuleSettings module={ proProps } />;
		}

		return adminAndNonAdmin ? (
			<FoldableCard
				className={ customClasses }
				key={ `module-card_${element[0]}` /* https://fb.me/react-warning-keys */ }
				header={ element[1] }
				subheader={ 'wordads' === element[0] ? wordAdsSubHeader : element[2] }
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
					moduleDescription
				}
				<div className="jp-module-settings__learn-more">
					<Button borderless compact href={ element[3] }><Gridicon icon="help-outline" /><span className="screen-reader-text">{ __( 'Learn More' ) }</span></Button>
				</div>
					{
						'stats' === element[0] && isModuleActive
							? <div className="jp-module-settings__read-more">
								<span>
									<span className="jp-module-settings__more-text">{
										__( 'View {{a}}All Stats{{/a}}', {
											components: {
												a: <a href={ props.siteAdminUrl + 'admin.php?page=stats' } />
											}
										} )
									}</span>
								</span>
							  </div>
							: ''
					}
					{
						'subscriptions' === element[0] && isModuleActive
							? <div className="jp-module-settings__read-more">
								<span>
									<span className="jp-module-settings__more-text">{
										__( 'View your {{a}}Email Followers{{/a}}', {
											components: {
												a: <a href={ 'https://wordpress.com/people/email-followers/' + props.siteRawUrl } />
											}
										} )
									}</span>
								</span>
							  </div>
							: ''
					}
					{
						'wordads' === element[0] && isModuleActive
							? <div className="jp-module-settings__read-more">
								<span>
									<ExternalLink
										className="jp-module-settings__external-link"
										icon={ true }
										iconSize={ 16 }
										href={`https://wordpress.com/ads/earnings/${window.location.hostname}`}>
											{ __( 'View your earnings' ) }
									</ExternalLink>
								</span>
							</div>
							: ''
					}

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

export const WordAdsSubHeaderTos = React.createClass( {
	render() {
		return (
			<div>
				{ this.props.subheader }
				<br/>
				<small>
					{ __( 'By activating ads, you agree to the Automattic Ads {{link}}Terms of Service{{/link}}.', {
						components: {
							link: <a href="https://wordpress.com/automattic-ads-tos/" target="_blank" />
						}
					} ) }
				</small>
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
			isTogglingModule: ( module_name ) => isActivatingModule( state, module_name ) || isDeactivatingModule( state, module_name ),
			getModule: ( module_name ) => _getModule( state, module_name ),
			isUnavailableInDevMode: ( module_name ) => isUnavailableInDevMode( state, module_name ),
			siteRawUrl: getSiteRawUrl( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
			isSitePublic: isSitePublic( state ),
			sitePlan: getSitePlan( state ),
			userCanManageModules: _userCanManageModules( state ),
			moduleList: getModules( state ),
			lastPostUrl: getLastPostUrl( state )
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
)( Engagement );
