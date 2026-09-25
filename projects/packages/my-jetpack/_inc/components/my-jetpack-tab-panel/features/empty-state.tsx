import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { info as infoIcon, search as searchIcon } from '@wordpress/icons';
import { Button, EmptyState, Link } from '@wordpress/ui';
import { useCallback, useEffect } from 'react';
import { reloadPage } from '../products/reload-page';
import { hasSearch } from '../products/utils';
import { useFeaturesTracking } from './features-tracking-context';
import styles from './styles.module.scss';
import type { EmptyStateReason } from './features-tracking-context';
import type { FeatureFilter } from './use-feature-filter';
import type { ReactNode } from 'react';

// Long enough for the queued Tracks pixel to leave, short enough to read as instant.
const RELOAD_DELAY = 300;

const infoMark = <EmptyState.Icon icon={ infoIcon } />;
const searchMark = <EmptyState.Icon icon={ searchIcon } />;

type EmptyProps = {
	mark?: ReactNode;
	heading: string;
	body?: string;
	children?: ReactNode;
};

/**
 * The shell every empty state is rendered in.
 *
 * @param {EmptyProps} props          - The component props.
 * @param {ReactNode}  props.mark     - What sits above the heading.
 * @param {string}     props.heading  - What matched nothing, in one line.
 * @param {string}     props.body     - Why, or what to do about it.
 * @param {ReactNode}  props.children - The way out of this state.
 * @return The rendered component.
 */
function Empty( { mark, heading, body, children }: EmptyProps ) {
	return (
		<EmptyState.Root className={ styles[ 'empty-state' ] }>
			{ mark }
			{ /* The grid sits under the page's own headings, so this one starts at h3. */ }
			<EmptyState.Title render={ <h3 /> }>{ heading }</EmptyState.Title>
			{ body && <EmptyState.Description>{ body }</EmptyState.Description> }
			{ children && <EmptyState.Actions>{ children }</EmptyState.Actions> }
		</EmptyState.Root>
	);
}

export type FeaturesEmptyStateProps = {
	search: string;
	filter: FeatureFilter;
	// False when the catalog never arrived, which is a failure to load rather than a
	// site with nothing to offer: the list itself is static.
	hasCatalog: boolean;
	onFilterChange: ( filter: FeatureFilter ) => void;
};

/**
 * Which empty state the grid fell into.
 *
 * @param props            - What emptied the grid.
 * @param props.search     - The search term in play, if any.
 * @param props.filter     - The filter in play.
 * @param props.hasCatalog - Whether the catalog arrived.
 * @return The reason, named as the events report it.
 */
function getEmptyStateReason( {
	search,
	filter,
	hasCatalog,
}: Omit< FeaturesEmptyStateProps, 'onFilterChange' > ): EmptyStateReason {
	// Checked before the search: a term that matched nothing in a list that never arrived
	// would otherwise blame the term.
	if ( ! hasCatalog ) {
		return 'no-catalog';
	}

	if ( hasSearch( search ) ) {
		return 'search';
	}

	if ( filter === 'active' || filter === 'inactive' ) {
		return filter;
	}

	return 'none';
}

/**
 * What the grid shows in place of cards, told apart by what emptied it.
 *
 * @param {FeaturesEmptyStateProps} props                - The component props.
 * @param {string}                  props.search         - The search term in play, if any.
 * @param {string}                  props.filter         - The filter in play.
 * @param {boolean}                 props.hasCatalog     - Whether the catalog arrived.
 * @param {Function}                props.onFilterChange - Switches the filter.
 * @return The rendered component.
 */
export function FeaturesEmptyState( {
	search,
	filter,
	hasCatalog,
	onFilterChange,
}: FeaturesEmptyStateProps ) {
	const tracking = useFeaturesTracking();
	const reason = getEmptyStateReason( { search, filter, hasCatalog } );

	// Keyed on the reason alone, so refining a search that is already finding nothing
	// stays one visit to one empty state. Its search_term is therefore the term that
	// emptied the grid, which may be a prefix of the one finally typed; settled terms
	// are what result_count on jetpack_myjetpack_features_search reports.
	useEffect( () => {
		tracking?.trackEmptyStateView( reason );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ reason ] );

	const showAll = useCallback( () => {
		tracking?.trackEmptyStateClick( reason, 'explore_all' );
		onFilterChange( 'all' );
	}, [ onFilterChange, reason, tracking ] );

	// Reloading in the same tick can cancel the event's pixel before it leaves, and this
	// is the one control here that reloads rather than navigating.
	const onReload = useCallback( () => {
		tracking?.trackEmptyStateClick( reason, 'reload' );
		setTimeout( reloadPage, RELOAD_DELAY );
	}, [ reason, tracking ] );

	const onSupportSearch = useCallback(
		() => tracking?.trackEmptyStateClick( reason, 'support_search' ),
		[ reason, tracking ]
	);

	// Both filter states offer the same way out: drop the filter and show everything.
	const exploreAll = (
		// A raw button rather than `Button`: it is what `Link` renders as, and this
		// control switches the filter in place rather than navigating anywhere.
		<Link
			className={ styles[ 'link-button' ] }
			render={ <button type="button" /> }
			onClick={ showAll }
		>
			{ __( 'Explore all', 'jetpack-my-jetpack' ) }
		</Link>
	);

	if ( reason === 'no-catalog' ) {
		return (
			<Empty
				heading={ __( 'We couldn’t load your features.', 'jetpack-my-jetpack' ) }
				body={ __( 'Refresh the page, or try again in a moment.', 'jetpack-my-jetpack' ) }
			>
				<Button variant="solid" onClick={ onReload }>
					{ __( 'Reload', 'jetpack-my-jetpack' ) }
				</Button>
			</Empty>
		);
	}

	if ( reason === 'search' ) {
		return (
			<Empty
				mark={ searchMark }
				heading={ sprintf(
					/* translators: %s is the term someone searched the features list for. */
					__( 'No features match “%s”.', 'jetpack-my-jetpack' ),
					search
				) }
				body={ __(
					'It may go by another name here, or the answer may be on jetpack.com.',
					'jetpack-my-jetpack'
				) }
			>
				<Link
					openInNewTab
					onClick={ onSupportSearch }
					href={ getRedirectUrl( 'jetpack-support', {
						query: `s=${ encodeURIComponent( search ) }`,
					} ) }
				>
					{ sprintf(
						/* translators: %s is the term someone searched the features list for. */
						__( 'Search jetpack.com for “%s”', 'jetpack-my-jetpack' ),
						search
					) }
				</Link>
			</Empty>
		);
	}

	if ( reason === 'active' ) {
		return (
			<Empty
				mark={ infoMark }
				heading={ __( 'No features are active yet.', 'jetpack-my-jetpack' ) }
				body={ __( 'Turn one on and it will appear here.', 'jetpack-my-jetpack' ) }
			>
				{ exploreAll }
			</Empty>
		);
	}

	if ( reason === 'inactive' ) {
		return (
			<Empty
				mark={ infoMark }
				heading={ __( 'Everything is turned on.', 'jetpack-my-jetpack' ) }
				body={ __( 'There are no inactive features left on this site.', 'jetpack-my-jetpack' ) }
			>
				{ exploreAll }
			</Empty>
		);
	}

	return <Empty heading={ __( 'No features found.', 'jetpack-my-jetpack' ) } />;
}
