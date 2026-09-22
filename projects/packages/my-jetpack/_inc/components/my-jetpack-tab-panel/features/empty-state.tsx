import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { Button, EmptyState, LinkButton } from '@wordpress/ui';
import { useCallback } from 'react';
import { reloadPage } from '../products/reload-page';
import styles from './styles.module.scss';
import type { FeatureFilter } from './use-feature-filter';
import type { ReactNode } from 'react';

type EmptyProps = {
	heading: string;
	body?: string;
	children?: ReactNode;
};

/**
 * The shell every empty state is rendered in.
 *
 * @param {EmptyProps} props          - The component props.
 * @param {string}     props.heading  - What matched nothing, in one line.
 * @param {string}     props.body     - Why, or what to do about it.
 * @param {ReactNode}  props.children - The way out of this state.
 * @return The rendered component.
 */
function Empty( { heading, body, children }: EmptyProps ) {
	return (
		<EmptyState.Root className={ styles[ 'empty-state' ] }>
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
	onClearSearch: () => void;
	onFilterChange: ( filter: FeatureFilter ) => void;
};

/**
 * What the grid shows in place of cards, told apart by what emptied it.
 *
 * @param {FeaturesEmptyStateProps} props                - The component props.
 * @param {string}                  props.search         - The search term in play, if any.
 * @param {string}                  props.filter         - The filter in play.
 * @param {boolean}                 props.hasCatalog     - Whether the catalog arrived.
 * @param {Function}                props.onClearSearch  - Drops the search term.
 * @param {Function}                props.onFilterChange - Switches the filter.
 * @return The rendered component.
 */
export function FeaturesEmptyState( {
	search,
	filter,
	hasCatalog,
	onClearSearch,
	onFilterChange,
}: FeaturesEmptyStateProps ) {
	const showAll = useCallback( () => onFilterChange( 'all' ), [ onFilterChange ] );
	const showActive = useCallback( () => onFilterChange( 'active' ), [ onFilterChange ] );

	// Checked before the search: a term that matched nothing in a list that never arrived
	// would otherwise blame the term.
	if ( ! hasCatalog ) {
		return (
			<Empty
				heading={ __( 'We couldn’t load your features.', 'jetpack-my-jetpack' ) }
				body={ __( 'Refresh the page, or try again in a moment.', 'jetpack-my-jetpack' ) }
			>
				<Button variant="solid" onClick={ reloadPage }>
					{ __( 'Reload', 'jetpack-my-jetpack' ) }
				</Button>
			</Empty>
		);
	}

	if ( search ) {
		return (
			<Empty
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
				<LinkButton
					variant="solid"
					openInNewTab
					href={ getRedirectUrl( 'jetpack-support', {
						query: `s=${ encodeURIComponent( search ) }`,
					} ) }
				>
					{ sprintf(
						/* translators: %s is the term someone searched the features list for. */
						__( 'Search jetpack.com for “%s”', 'jetpack-my-jetpack' ),
						search
					) }
				</LinkButton>
				<Button variant="outline" onClick={ onClearSearch }>
					{ __( 'Clear search', 'jetpack-my-jetpack' ) }
				</Button>
			</Empty>
		);
	}

	if ( filter === 'active' ) {
		return (
			<Empty
				heading={ __( 'No features are active yet.', 'jetpack-my-jetpack' ) }
				body={ __( 'Turn one on and it will appear here.', 'jetpack-my-jetpack' ) }
			>
				<Button variant="solid" onClick={ showAll }>
					{ __( 'Browse all features', 'jetpack-my-jetpack' ) }
				</Button>
			</Empty>
		);
	}

	if ( filter === 'inactive' ) {
		return (
			<Empty
				heading={ __( 'Everything is turned on.', 'jetpack-my-jetpack' ) }
				body={ __( 'There are no inactive features left on this site.', 'jetpack-my-jetpack' ) }
			>
				<Button variant="solid" onClick={ showActive }>
					{ __( 'View active features', 'jetpack-my-jetpack' ) }
				</Button>
			</Empty>
		);
	}

	return <Empty heading={ __( 'No features found.', 'jetpack-my-jetpack' ) } />;
}
