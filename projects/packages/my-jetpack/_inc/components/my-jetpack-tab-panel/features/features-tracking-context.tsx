import { createContext, useCallback, useContext, useMemo } from 'react';
import useAnalytics from '../../../hooks/use-analytics';
import type { FeatureState } from './feature-state';
import type { FeaturesView } from './toolbar';
import type { FeatureFilter } from './use-feature-filter';
import type { ReactNode } from 'react';

export type FeatureActionType = 'install' | 'activate' | 'deactivate';
export type BulkActionType = 'activate' | 'deactivate';

/** What emptied the grid, in the order the empty states are checked. */
export type EmptyStateReason = 'no-catalog' | 'search' | 'active' | 'inactive' | 'none';

/** The way out an empty state offers, whichever one it is showing. */
export type EmptyStateAction = 'reload' | 'support_search' | 'explore_all';

/**
 * Which control the click came from, since the card and the modal offer the same actions.
 * `more_features` is any control in that section, including its offer to activate Jetpack.
 */
export type FeatureActionOrigin = 'card' | 'modal' | 'more_features';

/** How a feature's details came to be open: from the grid, a link, or stepping from another's. */
export type ModalTrigger = 'card' | 'link' | 'step';

// This tab replaces the Products tab, whose events answer the same questions under
// different prop names. Stamping the schema lets a query tell the two apart, and bumping
// it is how a later change to these props stays readable in the same report.
const EVENT_VERSION = 1;

type FeatureActionParams = {
	// Absent where the control belongs to a section rather than to one feature.
	state?: FeatureState;
	action: FeatureActionType;
	origin: FeatureActionOrigin;
};

type BulkActionParams = {
	action: BulkActionType;
	/** How many features the run actually asked the site to switch. */
	attempted: number;
	/** Those it came back unable to switch. */
	failed: string[];
};

type FeaturesTrackingContextType = {
	trackFilterChange: ( next: FeatureFilter, count: number ) => void;
	trackSearch: ( term: string, resultCount: number ) => void;
	trackViewChange: ( next: FeaturesView ) => void;
	trackModalView: ( state: FeatureState, trigger: ModalTrigger ) => void;
	trackModalClose: ( state: FeatureState ) => void;
	trackManageClick: ( state: FeatureState ) => void;
	trackFeatureAction: ( params: FeatureActionParams ) => void;
	trackBulkAction: ( params: BulkActionParams ) => void;
	trackEmptyStateView: ( reason: EmptyStateReason ) => void;
	trackEmptyStateClick: ( reason: EmptyStateReason, action: EmptyStateAction ) => void;
} | null;

const FeaturesTrackingContext = createContext< FeaturesTrackingContextType >( null );

// Tracks types a field from the first value it ever records, so a property with nothing
// to say is left off the event rather than sent empty.
const when = ( key: string, value: string ) => ( value ? { [ key ]: value } : {} );

/**
 * What a feature was, for the events that name one.
 *
 * @param state - Live state for the feature.
 * @return The event properties describing it.
 */
function featureProps( state: FeatureState ) {
	const { feature } = state;

	return {
		feature_slug: feature.slug,
		feature_name: feature.name,
		feature_status: state.status,
		control_kind: state.control.kind,
		is_essential: Boolean( feature.essential ),
		...when( 'plugin', feature.plugin || '' ),
		...when( 'plugin_status', feature.plugin_status || '' ),
	};
}

export type FeaturesTrackingProviderProps = {
	children: ReactNode;
	filter: FeatureFilter;
	search: string;
	view: FeaturesView;
};

/**
 * Records what a visitor does with the Features tab.
 *
 * The filter, the search term and the layout ride along on every event, so a click
 * arrives with the grid it was made against rather than needing one reconstructed from
 * the events around it.
 *
 * @param {FeaturesTrackingProviderProps} props          - The component props.
 * @param {ReactNode}                     props.children - The tab's content.
 * @param {string}                        props.filter   - The active filter.
 * @param {string}                        props.search   - The search term.
 * @param {string}                        props.view     - Whether features show as a grid or a list.
 * @return The rendered component.
 */
export function FeaturesTrackingProvider( {
	children,
	filter,
	search,
	view,
}: FeaturesTrackingProviderProps ) {
	const { recordEvent } = useAnalytics();

	// Where the click was made, on every event that is not already reporting the change.
	const context = useMemo(
		() => ( {
			event_version: EVENT_VERSION,
			current_filter: filter,
			view,
			...when( 'search_term', search ),
		} ),
		[ filter, search, view ]
	);

	// `current_filter` repeats `previous_filter` here, so that the filter in play when a
	// click happened can be read the same way on every event this tab sends.
	const trackFilterChange = useCallback(
		( next: FeatureFilter, count: number ) => {
			recordEvent( 'jetpack_myjetpack_features_filter_change', {
				event_version: EVENT_VERSION,
				filter: next,
				previous_filter: filter,
				current_filter: filter,
				count,
				view,
				...when( 'search_term', search ),
			} );
		},
		[ filter, recordEvent, search, view ]
	);

	const trackSearch = useCallback(
		( term: string, resultCount: number ) => {
			recordEvent( 'jetpack_myjetpack_features_search', {
				event_version: EVENT_VERSION,
				search_term: term,
				result_count: resultCount,
				current_filter: filter,
				view,
			} );
		},
		[ filter, recordEvent, view ]
	);

	const trackViewChange = useCallback(
		( next: FeaturesView ) => {
			recordEvent( 'jetpack_myjetpack_features_view_change', {
				event_version: EVENT_VERSION,
				view: next,
				previous_view: view,
				current_filter: filter,
				...when( 'search_term', search ),
			} );
		},
		[ filter, recordEvent, search, view ]
	);

	const trackModalView = useCallback(
		( state: FeatureState, trigger: ModalTrigger ) => {
			recordEvent( 'jetpack_myjetpack_feature_modal_view', {
				trigger,
				...featureProps( state ),
				...context,
			} );
		},
		[ context, recordEvent ]
	);

	const trackModalClose = useCallback(
		( state: FeatureState ) => {
			recordEvent( 'jetpack_myjetpack_feature_modal_close', {
				...featureProps( state ),
				...context,
			} );
		},
		[ context, recordEvent ]
	);

	const trackManageClick = useCallback(
		( state: FeatureState ) => {
			recordEvent( 'jetpack_myjetpack_feature_manage_click', {
				...featureProps( state ),
				...context,
			} );
		},
		[ context, recordEvent ]
	);

	// Recorded from the click, so an abandoned or failed switch still says what was asked
	// for. The status it carries is the one the click was made against.
	const trackFeatureAction = useCallback(
		( { state, action, origin }: FeatureActionParams ) => {
			recordEvent( 'jetpack_myjetpack_feature_action', {
				action,
				origin,
				...( state ? featureProps( state ) : {} ),
				...context,
			} );
		},
		[ context, recordEvent ]
	);

	// The one event that waits for its request: how many switched is only known then.
	// `attempted` comes from the run itself, which drops anything already in the asked-for
	// state, so succeeded and failed always add up to it.
	const trackBulkAction = useCallback(
		( { action, attempted, failed }: BulkActionParams ) => {
			recordEvent( 'jetpack_myjetpack_features_bulk_action', {
				action,
				attempted,
				succeeded: attempted - failed.length,
				failed: failed.length,
				...when( 'failed_slugs', failed.join( ',' ) ),
				...context,
			} );
		},
		[ context, recordEvent ]
	);

	// Which of the five empty states the grid fell into, since they answer different
	// questions: a search that found nothing is a gap in the catalog or its wording,
	// while a failure to load is a bug.
	const trackEmptyStateView = useCallback(
		( reason: EmptyStateReason ) => {
			recordEvent( 'jetpack_myjetpack_features_empty_state_view', {
				reason,
				...context,
			} );
		},
		[ context, recordEvent ]
	);

	const trackEmptyStateClick = useCallback(
		( reason: EmptyStateReason, action: EmptyStateAction ) => {
			recordEvent( 'jetpack_myjetpack_features_empty_state_click', {
				reason,
				action,
				...context,
			} );
		},
		[ context, recordEvent ]
	);

	const value = useMemo(
		() => ( {
			trackFilterChange,
			trackSearch,
			trackViewChange,
			trackModalView,
			trackModalClose,
			trackManageClick,
			trackFeatureAction,
			trackBulkAction,
			trackEmptyStateView,
			trackEmptyStateClick,
		} ),
		[
			trackBulkAction,
			trackEmptyStateClick,
			trackEmptyStateView,
			trackFeatureAction,
			trackFilterChange,
			trackManageClick,
			trackModalClose,
			trackModalView,
			trackSearch,
			trackViewChange,
		]
	);

	return (
		<FeaturesTrackingContext.Provider value={ value }>
			{ children }
		</FeaturesTrackingContext.Provider>
	);
}

/**
 * The Features tab's tracking, for a component inside the provider.
 *
 * @return The tracking functions, or null outside the Features tab.
 */
export function useFeaturesTracking() {
	return useContext( FeaturesTrackingContext );
}
