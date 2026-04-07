import { isWoASite as _isWoASite } from '@automattic/jetpack-script-data';
import { __, _x } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { NavLink, useLocation } from 'react-router';
import QuerySitePlugins from 'components/data/query-site-plugins';
import Search from 'components/search';
import analytics from 'lib/analytics';
import {
	userCanManageModules as _userCanManageModules,
	userIsSubscriber as _userIsSubscriber,
	userCanPublish,
	isWpAdminNewsletterSettingsEnabled as _isWpAdminNewsletterSettingsEnabled,
} from 'state/initial-state';
import {
	hasAnyOfTheseModules,
	hasAnyPerformanceFeature,
	hasAnySecurityFeature,
	isModuleActivated,
} from 'state/modules';
import { filterSearch, getSearchTerm } from 'state/search';

// Map route paths to their translated tab labels.
// Used both for rendering tabs and for the mobile dropdown header text.
const TAB_LABELS = {
	'/security': _x( 'Security', 'Navigation item.', 'jetpack' ),
	'/performance': _x( 'Performance', 'Navigation item.', 'jetpack' ),
	'/writing': _x( 'Writing', 'Navigation item.', 'jetpack' ),
	'/sharing': _x( 'Sharing', 'Navigation item.', 'jetpack' ),
	'/discussion': _x( 'Discussion', 'Navigation item.', 'jetpack' ),
	'/traffic': _x( 'Traffic', 'Navigation item.', 'jetpack' ),
	'/newsletter': _x( 'Newsletter', 'Navigation item.', 'jetpack' ),
	'/reader': _x( 'Reader', 'Navigation item.', 'jetpack' ),
	'/earn': _x( 'Monetize', 'Navigation item.', 'jetpack' ),
};

const Tab = ( { to, label, onClick, alsoActiveFor } ) => {
	const { pathname } = useLocation();
	const extraActive = alsoActiveFor?.includes( pathname );

	return (
		<NavLink
			to={ to }
			// NavLink's className API requires a function — not a bind issue.
			// eslint-disable-next-line react/jsx-no-bind
			className={ ( { isActive } ) =>
				clsx( 'jp-settings-nav__tab', {
					'jp-settings-nav__tab--active': isActive || extraActive,
				} )
			}
			onClick={ onClick }
		>
			{ label }
		</NavLink>
	);
};

const SettingsNavTabs = props => {
	const {
		userCanManageModules,
		isSubscriber,
		isWoASite,
		userCanPublishPosts,
		hasSecurityFeature,
		hasPerformanceFeature,
		hasModules,
		isModuleActive,
		isWpAdminNewsletterSettingsEnabled,
		searchTerm,
		searchForTerm,
	} = props;

	const location = useLocation();
	const [ mobileOpen, setMobileOpen ] = useState( false );

	const selectedTabText = TAB_LABELS[ location.pathname ] || __( 'Settings', 'jetpack' );

	// Close the mobile dropdown when navigating to a new tab.
	useEffect( () => {
		setMobileOpen( false );
	}, [ location.pathname ] );

	const trackNavClick = target => {
		analytics.tracks.recordJetpackClick( {
			target: 'nav_item',
			path: target,
		} );
	};

	const doSearch = useCallback(
		keywords => {
			const splitUrl = window.location.href.split( '#' ),
				splitHash = splitUrl[ 1 ].split( '?' );

			searchForTerm( keywords );
			const searchURL =
				'#' + splitHash[ 0 ] + ( keywords ? '?term=' + encodeURIComponent( keywords ) : '' );
			window.location.href = searchURL;
		},
		[ searchForTerm ]
	);

	let tabs;

	/* eslint-disable react/jsx-no-bind -- Arrow callbacks for analytics tracking. */
	if ( userCanManageModules ) {
		tabs = (
			<>
				{ hasSecurityFeature && (
					<Tab
						to="/security"
						label={ TAB_LABELS[ '/security' ] }
						onClick={ () => trackNavClick( 'security' ) }
						alsoActiveFor={ [ '/settings' ] }
					/>
				) }
				{ hasPerformanceFeature && (
					<Tab
						to="/performance"
						label={ TAB_LABELS[ '/performance' ] }
						onClick={ () => trackNavClick( 'performance' ) }
					/>
				) }
				{ ( hasModules( [ 'markdown', 'post-by-email', 'infinite-scroll', 'copy-post' ] ) ||
					window.CUSTOM_CONTENT_TYPE__INITIAL_STATE?.active ) && (
					<Tab
						to="/writing"
						label={ TAB_LABELS[ '/writing' ] }
						onClick={ () => trackNavClick( 'writing' ) }
					/>
				) }
				{ hasModules( [ 'publicize', 'sharedaddy', 'likes' ] ) && (
					<Tab
						to="/sharing"
						label={ TAB_LABELS[ '/sharing' ] }
						onClick={ () => trackNavClick( 'sharing' ) }
					/>
				) }
				{ hasModules( [ 'comments', 'gravatar-hovercards', 'markdown' ] ) && (
					<Tab
						to="/discussion"
						label={ TAB_LABELS[ '/discussion' ] }
						onClick={ () => trackNavClick( 'discussion' ) }
					/>
				) }
				{ hasModules( [
					'seo-tools',
					'stats',
					'related-posts',
					'verification-tools',
					'sitemaps',
					'google-analytics',
				] ) && (
					<Tab
						to="/traffic"
						label={ TAB_LABELS[ '/traffic' ] }
						onClick={ () => trackNavClick( 'traffic' ) }
					/>
				) }
				{ hasModules( [ 'subscriptions' ] ) && ! isWpAdminNewsletterSettingsEnabled && (
					<Tab
						to="/newsletter"
						label={ TAB_LABELS[ '/newsletter' ] }
						onClick={ () => trackNavClick( 'newsletter' ) }
					/>
				) }
				{ hasModules( [ 'wpcom-reader' ] ) && ! isWoASite && (
					<Tab
						to="/reader"
						label={ TAB_LABELS[ '/reader' ] }
						onClick={ () => trackNavClick( 'reader' ) }
					/>
				) }
				{ hasModules( [ 'wordads' ] ) && (
					<Tab
						to="/earn"
						label={ TAB_LABELS[ '/earn' ] }
						onClick={ () => trackNavClick( 'earn' ) }
					/>
				) }
			</>
		);
	} else if ( isSubscriber ) {
		tabs = null;
	} else {
		tabs = (
			<>
				{ isModuleActive( 'post-by-email' ) &&
					userCanPublishPosts &&
					hasModules( [ 'post-by-email' ] ) && (
						<Tab
							to="/writing"
							label={ TAB_LABELS[ '/writing' ] }
							onClick={ () => trackNavClick( 'writing' ) }
						/>
					) }
				{ isModuleActive( 'publicize' ) && userCanPublishPosts && hasModules( [ 'publicize' ] ) && (
					<Tab
						to="/sharing"
						label={ TAB_LABELS[ '/sharing' ] }
						onClick={ () => trackNavClick( 'sharing' ) }
						alsoActiveFor={ [ '/settings' ] }
					/>
				) }
			</>
		);
	}
	/* eslint-enable react/jsx-no-bind */

	const searchFromUrl = useMemo(
		() => new URLSearchParams( location.search ).get( 'term' ) || '',
		[ location.search ]
	);

	// Sync URL search term to Redux on mount and route changes,
	// matching the old NavigationSettings.onRouteChange behavior.
	useEffect( () => {
		searchForTerm( searchFromUrl );
	}, [ searchFromUrl, searchForTerm ] );

	/* eslint-disable react/jsx-no-bind -- Trivial toggle callback. */
	return (
		<div className={ clsx( 'jp-settings-nav', { 'is-open': mobileOpen } ) }>
			<QuerySitePlugins />
			<button
				className={ clsx( 'jp-settings-nav__mobile-header', { 'is-open': mobileOpen } ) }
				onClick={ () => setMobileOpen( ! mobileOpen ) }
				aria-expanded={ mobileOpen }
			>
				<span>{ selectedTabText }</span>
				<span
					className={ clsx( 'dashicons', 'jp-settings-nav__mobile-chevron', {
						'dashicons-arrow-up-alt2': mobileOpen,
						'dashicons-arrow-down-alt2': ! mobileOpen,
					} ) }
				/>
			</button>
			<nav
				className="jp-settings-nav__tabs"
				aria-label={ __( 'Jetpack settings sections', 'jetpack' ) }
			>
				{ tabs }
			</nav>
			{ userCanManageModules && (
				<Search
					pinned={ true }
					fitsContainer={ true }
					placeholder={ __( 'Search for a Jetpack feature.', 'jetpack' ) }
					delaySearch={ true }
					delayTimeout={ 500 }
					onSearch={ doSearch }
					isOpen={ !! searchTerm }
					initialValue={ searchTerm || searchFromUrl }
				/>
			) }
		</div>
	);
	/* eslint-enable react/jsx-no-bind */
};

export default connect(
	state => ( {
		userCanManageModules: _userCanManageModules( state ),
		isSubscriber: _userIsSubscriber( state ),
		isWoASite: _isWoASite( state ),
		userCanPublishPosts: userCanPublish( state ),
		hasSecurityFeature: hasAnySecurityFeature( state ),
		hasPerformanceFeature: hasAnyPerformanceFeature( state ),
		hasModules: modules => hasAnyOfTheseModules( state, modules ),
		isModuleActive: module => isModuleActivated( state, module ),
		isWpAdminNewsletterSettingsEnabled: _isWpAdminNewsletterSettingsEnabled( state ),
		searchTerm: getSearchTerm( state ),
	} ),
	dispatch => ( {
		searchForTerm: term => dispatch( filterSearch( term ) ),
	} )
)( SettingsNavTabs );
