import { isWoASite as _isWoASite } from '@automattic/jetpack-script-data';
import { __, _x } from '@wordpress/i18n';
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
} from 'state/initial-state';
import {
	hasAnyOfTheseModules,
	hasAnyPerformanceFeature,
	hasAnySecurityFeature,
	isModuleActivated,
} from 'state/modules';
import { filterSearch, getSearchTerm } from 'state/search';

const Tab = ( { to, label, onClick, alsoActiveFor } ) => {
	const location = useLocation();
	const extraActive = alsoActiveFor ? alsoActiveFor.includes( location.pathname ) : false;

	return (
		<NavLink
			to={ to }
			// eslint-disable-next-line react/jsx-no-bind
			className={ ( { isActive } ) =>
				isActive || extraActive
					? 'jp-settings-nav__tab jp-settings-nav__tab--active'
					: 'jp-settings-nav__tab'
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
		searchTerm,
		searchForTerm,
	} = props;

	const location = useLocation();
	const [ mobileOpen, setMobileOpen ] = useState( false );

	// Map route paths to their translated tab labels for the mobile header.
	const tabLabels = useMemo(
		() => ( {
			'/security': _x( 'Security', 'Navigation item.', 'jetpack' ),
			'/performance': _x( 'Performance', 'Navigation item.', 'jetpack' ),
			'/writing': _x( 'Writing', 'Navigation item.', 'jetpack' ),
			'/sharing': _x( 'Sharing', 'Navigation item.', 'jetpack' ),
			'/discussion': _x( 'Discussion', 'Navigation item.', 'jetpack' ),
			'/traffic': _x( 'Traffic', 'Navigation item.', 'jetpack' ),
			'/newsletter': _x( 'Newsletter', 'Navigation item.', 'jetpack' ),
			'/reader': _x( 'Reader', 'Navigation item.', 'jetpack' ),
			'/earn': _x( 'Monetize', 'Navigation item.', 'jetpack' ),
		} ),
		[]
	);

	const selectedTabText = tabLabels[ location.pathname ] || __( 'Settings', 'jetpack' );

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
						label={ _x( 'Security', 'Navigation item.', 'jetpack' ) }
						onClick={ () => trackNavClick( 'security' ) }
						alsoActiveFor={ [ '/settings' ] }
					/>
				) }
				{ hasPerformanceFeature && (
					<Tab
						to="/performance"
						label={ _x( 'Performance', 'Navigation item.', 'jetpack' ) }
						onClick={ () => trackNavClick( 'performance' ) }
					/>
				) }
				{ ( hasModules( [ 'markdown', 'post-by-email', 'infinite-scroll', 'copy-post' ] ) ||
					window.CUSTOM_CONTENT_TYPE__INITIAL_STATE?.active ) && (
					<Tab
						to="/writing"
						label={ _x( 'Writing', 'Navigation item.', 'jetpack' ) }
						onClick={ () => trackNavClick( 'writing' ) }
					/>
				) }
				{ hasModules( [ 'publicize', 'sharedaddy', 'likes' ] ) && (
					<Tab
						to="/sharing"
						label={ _x( 'Sharing', 'Navigation item.', 'jetpack' ) }
						onClick={ () => trackNavClick( 'sharing' ) }
					/>
				) }
				{ hasModules( [ 'comments', 'gravatar-hovercards', 'markdown' ] ) && (
					<Tab
						to="/discussion"
						label={ _x( 'Discussion', 'Navigation item.', 'jetpack' ) }
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
						label={ _x( 'Traffic', 'Navigation item.', 'jetpack' ) }
						onClick={ () => trackNavClick( 'traffic' ) }
					/>
				) }
				{ hasModules( [ 'subscriptions' ] ) && (
					<Tab
						to="/newsletter"
						label={ _x( 'Newsletter', 'Navigation item.', 'jetpack' ) }
						onClick={ () => trackNavClick( 'newsletter' ) }
					/>
				) }
				{ hasModules( [ 'wpcom-reader' ] ) && ! isWoASite && (
					<Tab
						to="/reader"
						label={ _x( 'Reader', 'Navigation item.', 'jetpack' ) }
						onClick={ () => trackNavClick( 'reader' ) }
					/>
				) }
				{ hasModules( [ 'wordads' ] ) && (
					<Tab
						to="/earn"
						label={ _x( 'Monetize', 'Navigation item.', 'jetpack' ) }
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
							label={ _x( 'Writing', 'Navigation item.', 'jetpack' ) }
							onClick={ () => trackNavClick( 'writing' ) }
						/>
					) }
				{ isModuleActive( 'publicize' ) && userCanPublishPosts && hasModules( [ 'publicize' ] ) && (
					<Tab
						to="/sharing"
						label={ _x( 'Sharing', 'Navigation item.', 'jetpack' ) }
						onClick={ () => trackNavClick( 'sharing' ) }
						alsoActiveFor={ [ '/settings' ] }
					/>
				) }
			</>
		);
	}

	const searchFromUrl = useMemo(
		() => new URLSearchParams( location.search ).get( 'term' ) || '',
		[ location.search ]
	);

	// Sync URL search term to Redux on mount and route changes,
	// matching the old NavigationSettings.onRouteChange behavior.
	useEffect( () => {
		searchForTerm( searchFromUrl );
	}, [ searchFromUrl, searchForTerm ] );

	return (
		<div className={ `jp-settings-nav ${ mobileOpen ? 'is-open' : '' }` }>
			<QuerySitePlugins />
			<button
				className={ `jp-settings-nav__mobile-header ${ mobileOpen ? 'is-open' : '' }` }
				onClick={ () => setMobileOpen( ! mobileOpen ) }
				aria-expanded={ mobileOpen }
			>
				<span>{ selectedTabText }</span>
				<span
					className={ `dashicons jp-settings-nav__mobile-chevron ${
						mobileOpen ? 'dashicons-arrow-up-alt2' : 'dashicons-arrow-down-alt2'
					}` }
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
		searchTerm: getSearchTerm( state ),
	} ),
	dispatch => ( {
		searchForTerm: term => dispatch( filterSearch( term ) ),
	} )
)( SettingsNavTabs );
