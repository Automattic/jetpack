import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { info as infoIcon, search as searchIcon } from '@wordpress/icons';
import { Button, EmptyState, Link } from '@wordpress/ui';
import { useCallback } from 'react';
import { reloadPage } from '../products/reload-page';
import { hasSearch } from '../products/utils';
import styles from './styles.module.scss';
import type { FeatureFilter } from './use-feature-filter';
import type { ReactNode } from 'react';

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
	const showAll = useCallback( () => onFilterChange( 'all' ), [ onFilterChange ] );

	// Both filter states offer the same way out: drop the filter and show everything.
	const exploreAll = (
		// ds-allow: button -- Link's render target; this switches the filter rather than navigating.
		<Link
			className={ styles[ 'link-button' ] }
			render={ <button type="button" /> }
			onClick={ showAll }
		>
			{ __( 'Explore all', 'jetpack-my-jetpack' ) }
		</Link>
	);

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

	if ( hasSearch( search ) ) {
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

	if ( filter === 'active' ) {
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

	if ( filter === 'inactive' ) {
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
