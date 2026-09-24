import { _n, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { BulkBar } from './bulk-bar';
import { FeaturesEmptyState } from './empty-state';
import { FeatureItem } from './feature-item';
import { FeatureList, UnswitchableNote } from './feature-list';
import { FeatureModal } from './feature-modal';
import { useFeatureStates } from './feature-state';
import { FeaturesBanner } from './features-banner';
import { FeaturesTrackingProvider, useFeaturesTracking } from './features-tracking-context';
import { MenuPointer } from './menu-pointer';
import { MoreFeatures } from './more-features';
import styles from './styles.module.scss';
import { Toolbar } from './toolbar';
import { getFeatureFilters, isFeatureFilter, matchesFilter } from './use-feature-filter';
import { useFeatureSearch } from './use-feature-search';
import { useFeatureSelection } from './use-feature-selection';
import { useMainFeatures } from './use-main-features';
import { filterMoreFeatures, useMoreFeatures } from './use-more-features';
import { useSidebarSync } from './use-sidebar-sync';
import { useStepOrder } from './use-step-order';
import type { FeatureState } from './feature-state';
import type { FeaturesView } from './toolbar';
import type { FeatureFilter } from './use-feature-filter';

// Long enough that tracking a search reports the term someone settled on rather than
// every prefix they typed on the way to it. Matches the Products tab.
const SEARCH_TRACKING_DELAY = 500;

/**
 * Reads the grid's state out of the URL.
 *
 * @return The active filter, search term, layout, and the feature whose modal is open.
 */
function useFeaturesParams() {
	const [ searchParams ] = useSearchParams();
	const filterParam = searchParams.get( 'filter' ) || 'all';

	return {
		search: searchParams.get( 'search' ) || '',
		filter: ( isFeatureFilter( filterParam ) ? filterParam : 'all' ) as FeatureFilter,
		openSlug: searchParams.get( 'feature' ),
		view: ( searchParams.get( 'view' ) === 'list' ? 'list' : 'grid' ) as FeaturesView,
	};
}

/**
 * The Features content component.
 *
 * Wraps the tab in its tracking, which needs the grid's state to report what a click was
 * made against — so the state is read here and the content below reads it again.
 *
 * @return The rendered component.
 */
export function FeaturesContent() {
	const { filter, search, view } = useFeaturesParams();

	return (
		<FeaturesTrackingProvider filter={ filter } search={ search } view={ view }>
			<FeaturesTabContent />
		</FeaturesTrackingProvider>
	);
}

/**
 * The features themselves, with the toolbar above them and the modal over them.
 *
 * Owns the filter and the search term for the grid, both kept in the URL so a narrowed
 * list survives a reload and travels in a shared link.
 *
 * @return The rendered component.
 */
function FeaturesTabContent() {
	const mainFeatures = useMainFeatures();
	const { states, isLoading } = useFeatureStates( mainFeatures );
	const { pointer, dismissPointer } = useSidebarSync( mainFeatures.features );
	const moreFeatures = useMoreFeatures( mainFeatures );
	const tracking = useFeaturesTracking();

	const [ searchParams, setSearchParams ] = useSearchParams();

	const { search, filter, openSlug, view } = useFeaturesParams();

	const updateParams = useCallback(
		( changes: Record< string, string | null > ) => {
			const next = new URLSearchParams( searchParams );

			Object.entries( changes ).forEach( ( [ key, value ] ) => {
				if ( value ) {
					next.set( key, value );
				} else {
					next.delete( key );
				}
			} );

			setSearchParams( next, { replace: true } );
		},
		[ searchParams, setSearchParams ]
	);

	// Searching replaces the grid outright, the way it does on the Products tab, so a
	// term in play takes the filter's place rather than narrowing alongside it.
	const results = useFeatureSearch( states, search );
	const visible = useMemo(
		() =>
			results ??
			// A feature being switched stays put: its status has moved to what the click
			// asked for, and dropping the card out of the list mid-request takes away the
			// control and the place any error notice refers to.
			states.filter( state => matchesFilter( state, filter ) || state.isSwitching ),
		[ filter, results, states ]
	);
	const visibleMore = useMemo(
		() => filterMoreFeatures( moreFeatures, filter, search ),
		[ moreFeatures, filter, search ]
	);
	// Flattened once: the bulk bar selects over both lists, and the counts read both.
	const visibleMoreStates = useMemo(
		() => visibleMore.flatMap( group => group.states ),
		[ visibleMore ]
	);
	const shownCount = visible.length + visibleMoreStates.length;

	const selection = useFeatureSelection(
		useMemo( () => [ ...visible, ...visibleMoreStates ], [ visible, visibleMoreStates ] ),
		mainFeatures.jetpack === 'active'
	);

	// Counted against every feature, not the visible ones, so a pill says how many it
	// would show rather than how many survived the filter already in play.
	const counts = useMemo( () => {
		const countable = [ ...states, ...moreFeatures.flatMap( group => group.states ) ];

		return Object.fromEntries(
			getFeatureFilters( filter ).map( ( { value } ) => [
				value,
				countable.filter( state => matchesFilter( state, value ) ).length,
			] )
		) as Record< FeatureFilter, number >;
	}, [ states, moreFeatures, filter ] );

	const open = states.find( item => item.feature.slug === openSlug );

	// Set by the grid so the view event can tell a card click from a link opened straight
	// to a feature, which the URL alone cannot.
	const openedFromCardRef = useRef( false );

	const openFeature = useCallback(
		( slug: string ) => {
			openedFromCardRef.current = true;
			updateParams( { feature: slug } );
		},
		[ updateParams ]
	);
	const closeFeature = useCallback( () => updateParams( { feature: null } ), [ updateParams ] );

	// The modal opens from a link as well as from a card, and closes by being navigated
	// away from as well as by its own button, so both events are taken from the URL
	// rather than from the handlers above.
	const shownRef = useRef< string | null >( null );
	const shownStateRef = useRef< FeatureState | null >( null );

	useEffect( () => {
		if ( ! tracking ) {
			return;
		}

		if ( openSlug && open ) {
			if ( shownRef.current !== openSlug ) {
				tracking.trackModalView( open, openedFromCardRef.current ? 'card' : 'link' );
				shownRef.current = openSlug;
				openedFromCardRef.current = false;
			}

			// Kept current so closing reports the feature as the visitor left it.
			shownStateRef.current = open;
		}

		if ( ! openSlug && shownRef.current ) {
			if ( shownStateRef.current ) {
				tracking.trackModalClose( shownStateRef.current );
			}

			shownRef.current = null;
			shownStateRef.current = null;
		}
	}, [ open, openSlug, tracking ] );

	const searchTimeoutRef = useRef< ReturnType< typeof setTimeout > | null >( null );
	const trackedSearchRef = useRef( '' );
	const pendingSearchRef = useRef( '' );
	// Both read when the delay is up rather than when the key was pressed, so the count
	// and the grid reported are the ones the visitor is looking at by then — the filter
	// or the layout may have moved on since.
	const visibleCountRef = useRef( 0 );
	const trackingRef = useRef( tracking );

	useEffect( () => {
		visibleCountRef.current = visible.length;
		trackingRef.current = tracking;
	} );

	const sendSearch = useCallback( () => {
		const term = pendingSearchRef.current;
		pendingSearchRef.current = '';

		// An emptied box is the end of a search rather than one of its own.
		if ( term && term !== trackedSearchRef.current ) {
			trackingRef.current?.trackSearch( term, visibleCountRef.current );
		}

		trackedSearchRef.current = term;
	}, [] );

	// Dropped whenever something other than typing clears the term, so the next search
	// starts from nothing: the timer would otherwise report a term already navigated away
	// from, and the ref would swallow that same term when it is searched for again.
	const forgetPendingSearch = useCallback( () => {
		clearTimeout( searchTimeoutRef.current ?? undefined );
		pendingSearchRef.current = '';
		trackedSearchRef.current = '';
	}, [] );

	// Sent rather than dropped on the way out: a search abandoned for the thing it found
	// is the one worth knowing about.
	useEffect( () => {
		return () => {
			if ( searchTimeoutRef.current ) {
				clearTimeout( searchTimeoutRef.current );
				sendSearch();
			}
		};
	}, [ sendSearch ] );

	const onSearchChange = useCallback(
		( term: string ) => {
			updateParams( { search: term || null, feature: null } );

			clearTimeout( searchTimeoutRef.current ?? undefined );
			pendingSearchRef.current = term;
			searchTimeoutRef.current = setTimeout( sendSearch, SEARCH_TRACKING_DELAY );
		},
		[ sendSearch, updateParams ]
	);

	// How many the grid would show, counted here rather than read from `counts`, which
	// only holds the filters offered as pills — a plan badge can pick one that is not.
	const countFor = useCallback(
		( next: FeatureFilter ) => states.filter( state => matchesFilter( state, next ) ).length,
		[ states ]
	);

	const onFilterChange = useCallback(
		// Clears the search: a term in play replaces the grid outright, so a pill picked
		// while searching would otherwise light up and change nothing.
		( next: FeatureFilter ) => {
			// The pills stay clickable while active, and picking the one already in play
			// changes nothing to report.
			if ( next !== filter ) {
				tracking?.trackFilterChange( next, countFor( next ) );
			}

			forgetPendingSearch();
			updateParams( { filter: next === 'all' ? null : next, search: null } );
		},
		[ countFor, filter, forgetPendingSearch, tracking, updateParams ]
	);

	// A plan badge answers "what else is in this?", so it filters and steps out of the modal.
	const onFilterByPlan = useCallback(
		( plan: FeatureFilter ) => {
			if ( plan !== filter ) {
				tracking?.trackFilterChange( plan, countFor( plan ) );
			}

			forgetPendingSearch();
			updateParams( { filter: plan, feature: null, search: null } );
		},
		[ countFor, filter, forgetPendingSearch, tracking, updateParams ]
	);

	const onViewChange = useCallback(
		( next: FeaturesView ) => {
			if ( next !== view ) {
				tracking?.trackViewChange( next );
			}

			updateParams( { view: next === 'grid' ? null : next } );
		},
		[ tracking, updateParams, view ]
	);

	// Arrow keys step through what the grid shows, so a filter or search bounds them too.
	// Retaken once modules land, since a status filter reads every pending feature as inactive.
	const stepOrder = useStepOrder( visible, openSlug, `${ filter }|${ search }|${ isLoading }` );
	const openIndex = stepOrder.findIndex( feature => feature.slug === openSlug );

	// Neither read has anything to say yet: a seed-only catalog is not a failure to load
	// one, and features whose modules are still in flight all read inactive, which would
	// otherwise announce "nothing is active" on a site with plenty on.
	// Only the status filters wait on the modules: a search or a plan filter is already
	// a settled answer once the catalog is here, and an unreachable module read would
	// otherwise leave those two with no message at all.
	const onStatus = filter === 'active' || filter === 'inactive';
	const settling =
		( mainFeatures.isPlaceholderData && mainFeatures.features.length === 0 ) ||
		( onStatus && states.some( state => state.pending ) );

	return (
		<section className={ styles.content }>
			<FeaturesBanner />

			<Toolbar
				view={ view }
				onViewChange={ onViewChange }
				filter={ filter }
				onFilterChange={ onFilterChange }
				counts={ counts }
				countsPending={ isLoading }
				search={ search }
				onSearchChange={ onSearchChange }
				bulk={ view === 'list' && shownCount > 0 ? <BulkBar selection={ selection } /> : null }
			/>

			{ /* Always rendered, so a screen reader is listening before the count changes. */ }
			<p className="screen-reader-text" role="status">
				{ sprintf(
					/* translators: %d is how many features the filter or search matched. */
					_n( '%d feature shown', '%d features shown', shownCount, 'jetpack-my-jetpack' ),
					shownCount
				) }
			</p>

			{ view === 'list' && shownCount > 0 && <UnswitchableNote /> }

			{ shownCount === 0 && ! settling && (
				<FeaturesEmptyState
					search={ search }
					filter={ filter }
					hasCatalog={ mainFeatures.features.length > 0 }
					onFilterChange={ onFilterChange }
				/>
			) }
			{ visible.length > 0 &&
				( view === 'list' ? (
					<FeatureList states={ visible } onOpen={ openFeature } selection={ selection } />
				) : (
					<div className={ styles[ 'feature-grid' ] }>
						{ visible.map( state => (
							<FeatureItem key={ state.feature.slug } state={ state } onOpen={ openFeature } />
						) ) }
					</div>
				) ) }

			{ pointer && <MenuPointer target={ pointer } onDismiss={ dismissPointer } /> }
			<MoreFeatures
				groups={ visibleMore }
				selection={ selection }
				jetpack={ mainFeatures.jetpack }
				isList={ view === 'list' }
				isNarrowed={ filter !== 'all' || Boolean( search ) }
			/>

			{ open && (
				<FeatureModal
					state={ open }
					previous={ openIndex > 0 ? stepOrder[ openIndex - 1 ] : undefined }
					next={ openIndex >= 0 ? stepOrder[ openIndex + 1 ] : undefined }
					position={ openIndex + 1 }
					total={ stepOrder.length }
					onStep={ openFeature }
					onClose={ closeFeature }
					onFilterByPlan={ onFilterByPlan }
				/>
			) }
		</section>
	);
}
