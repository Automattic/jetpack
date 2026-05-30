import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { envelope, search as searchIcon } from '@wordpress/icons';
import { Button, EmptyState } from '@wordpress/ui';
import { recordTracksEvent } from '../lib/tracks';

type Props = {
	hasFiltersOrSearch: boolean;
	onAddSubscribers: () => void;
};

/**
 * Empty-state for the subscribers table. Renders inside DataViews' `empty` slot so the
 * search/filter chrome stays visible. Mirrors Forms' approach of differentiating the
 * "nothing here yet" vs. "your filters didn't match" cases with their own icon + copy.
 *
 * @param props                    - Component props.
 * @param props.hasFiltersOrSearch - True when an active filter or search would explain the empty result.
 * @param props.onAddSubscribers   - Click handler for the "Add subscribers" CTA (rendered only in the cold-start case).
 * @return Empty-state body.
 */
export default function SubscribersEmptyState( {
	hasFiltersOrSearch,
	onAddSubscribers,
}: Props ): JSX.Element {
	useEffect( () => {
		recordTracksEvent( 'jetpack_subscribers_empty_view_displayed', {
			has_filters_or_search: hasFiltersOrSearch,
		} );
	}, [ hasFiltersOrSearch ] );

	if ( hasFiltersOrSearch ) {
		return (
			<EmptyState.Root>
				<EmptyState.Visual>
					<EmptyState.Icon icon={ searchIcon } />
				</EmptyState.Visual>
				<EmptyState.Title>
					{ __( 'No matching subscribers', 'jetpack-newsletter' ) }
				</EmptyState.Title>
				<EmptyState.Description>
					{ __(
						'Try adjusting your filters or search to see more subscribers.',
						'jetpack-newsletter'
					) }
				</EmptyState.Description>
			</EmptyState.Root>
		);
	}

	return (
		<EmptyState.Root>
			<EmptyState.Visual>
				<EmptyState.Icon icon={ envelope } />
			</EmptyState.Visual>
			<EmptyState.Title>{ __( 'No subscribers yet', 'jetpack-newsletter' ) }</EmptyState.Title>
			<EmptyState.Description>
				{ __(
					'Bring readers in by inviting them by email. They’ll get a confirmation message and start receiving your posts.',
					'jetpack-newsletter'
				) }
			</EmptyState.Description>
			<EmptyState.Actions>
				<Button onClick={ onAddSubscribers }>
					{ __( 'Add subscribers', 'jetpack-newsletter' ) }
				</Button>
			</EmptyState.Actions>
		</EmptyState.Root>
	);
}
