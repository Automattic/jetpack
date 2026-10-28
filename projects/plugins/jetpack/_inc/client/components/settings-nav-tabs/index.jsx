import { isWoASite as _isWoASite } from '@automattic/jetpack-script-data';
import { __, _x } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { useCallback, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { useLocation, useNavigate } from 'react-router';
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
	hasProtectPage as _hasProtectPage,
	isModuleActivated,
} from 'state/modules';
import { filterSearch, getSearchTerm } from 'state/search';
import './style.scss';

// Map route paths to their translated tab labels.
const TAB_LABELS = {
	'/security': _x( 'Security', 'Navigation item.', 'jetpack' ),
	'/performance': _x( 'Performance', 'Navigation item.', 'jetpack' ),
	'/writing': _x( 'Writing', 'Navigation item.', 'jetpack' ),
	'/sharing': _x( 'Sharing', 'Navigation item.', 'jetpack' ),
	'/discussion': _x( 'Discussion', 'Navigation item.', 'jetpack' ),
	'/traffic': _x( 'Traffic', 'Navigation item.', 'jetpack' ),
	'/reader': _x( 'Reader', 'Navigation item.', 'jetpack' ),
	'/earn': _x( 'Monetize', 'Navigation item.', 'jetpack' ),
};

/**
 * Settings page tab navigation using `@wordpress/ui` Tabs.
 *
 * @param {object} props - Component props from Redux.
 * @return {import('react').ReactNode} The settings navigation tabs.
 */
const SettingsNavTabs = props => {
	const {
		userCanManageModules,
		isSubscriber,
		isWoASite,
		userCanPublishPosts,
		hasSecurityFeature,
		hasProtectPage,
		hasPerformanceFeature,
		hasModules,
		isModuleActive,
		searchTerm,
		searchForTerm,
	} = props;

	const location = useLocation();
	const navigate = useNavigate();

	const trackNavClick = target => {
		analytics.tracks.recordJetpackClick( {
			target: 'nav_item',
			path: target,
		} );
	};

	const handleTabChange = useCallback(
		value => {
			trackNavClick( value.slice( 1 ) );
			navigate( value );
		},
		[ navigate ]
	);

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

	const searchFromUrl = useMemo(
		() => new URLSearchParams( location.search ).get( 'term' ) || '',
		[ location.search ]
	);

	// Sync URL search term to Redux on mount and route changes.
	useEffect( () => {
		searchForTerm( searchFromUrl );
	}, [ searchFromUrl, searchForTerm ] );

	// Build the list of visible tabs based on permissions and modules.
	const visibleTabs = [];

	if ( userCanManageModules ) {
		if ( hasSecurityFeature && ! hasProtectPage ) {
			visibleTabs.push( '/security' );
		}
		if ( hasPerformanceFeature ) {
			visibleTabs.push( '/performance' );
		}
		if (
			hasModules( [ 'markdown', 'post-by-email', 'infinite-scroll', 'copy-post' ] ) ||
			window.CUSTOM_CONTENT_TYPE__INITIAL_STATE?.active
		) {
			visibleTabs.push( '/writing' );
		}
		if ( hasModules( [ 'publicize', 'sharedaddy', 'likes' ] ) ) {
			visibleTabs.push( '/sharing' );
		}
		if ( hasModules( [ 'comments', 'gravatar-hovercards', 'markdown' ] ) ) {
			visibleTabs.push( '/discussion' );
		}
		if (
			hasModules( [
				'seo-tools',
				'stats',
				'related-posts',
				'verification-tools',
				'sitemaps',
				'google-analytics',
			] )
		) {
			visibleTabs.push( '/traffic' );
		}
		if ( hasModules( [ 'wpcom-reader' ] ) && ! isWoASite ) {
			visibleTabs.push( '/reader' );
		}
		if ( hasModules( [ 'wordads' ] ) ) {
			visibleTabs.push( '/earn' );
		}
	} else if ( ! isSubscriber ) {
		if (
			isModuleActive( 'post-by-email' ) &&
			userCanPublishPosts &&
			hasModules( [ 'post-by-email' ] )
		) {
			visibleTabs.push( '/writing' );
		}
		if ( isModuleActive( 'publicize' ) && userCanPublishPosts && hasModules( [ 'publicize' ] ) ) {
			visibleTabs.push( '/sharing' );
		}
	}

	// /settings shows Security to admins, so with the Protect page it opens the first tab instead.
	const isSettingsRoot = '/settings' === location.pathname;
	const firstTab = userCanManageModules && hasProtectPage ? visibleTabs[ 0 ] : undefined;
	const activeTab = isSettingsRoot ? ( firstTab ?? '/security' ) : location.pathname;
	const shouldOpenFirstTab = isSettingsRoot && !! firstTab && ! searchFromUrl;

	useEffect( () => {
		if ( shouldOpenFirstTab ) {
			navigate( firstTab, { replace: true } );
		}
	}, [ shouldOpenFirstTab, firstTab, navigate ] );

	if ( visibleTabs.length === 0 ) {
		return null;
	}

	return (
		<div className="jp-settings-nav">
			<QuerySitePlugins />
			<Tabs.Root
				value={ activeTab }
				onValueChange={ handleTabChange }
				className="jp-settings-nav__tabs-root"
			>
				<Tabs.List
					variant="minimal"
					className="jp-settings-nav__tabs"
					aria-label={ __( 'Jetpack settings sections', 'jetpack' ) }
				>
					{ visibleTabs.map( path => (
						<Tabs.Tab key={ path } value={ path } className="jp-settings-nav__tab">
							{ TAB_LABELS[ path ] }
						</Tabs.Tab>
					) ) }
				</Tabs.List>
			</Tabs.Root>
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
};

export default connect(
	state => ( {
		userCanManageModules: _userCanManageModules( state ),
		isSubscriber: _userIsSubscriber( state ),
		isWoASite: _isWoASite( state ),
		userCanPublishPosts: userCanPublish( state ),
		hasSecurityFeature: hasAnySecurityFeature( state ),
		hasProtectPage: _hasProtectPage( state ),
		hasPerformanceFeature: hasAnyPerformanceFeature( state ),
		hasModules: modules => hasAnyOfTheseModules( state, modules ),
		isModuleActive: module => isModuleActivated( state, module ),
		searchTerm: getSearchTerm( state ),
	} ),
	dispatch => ( {
		searchForTerm: term => dispatch( filterSearch( term ) ),
	} )
)( SettingsNavTabs );
