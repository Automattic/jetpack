import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

type Props = {
	onAddSubscribers: () => void;
};

/**
 * Empty-state placeholder shown when the table has zero results AND no filters are active.
 * Mirrors Calypso's `JetpackEmptyListView` copy in spirit — encourages adding the first
 * subscriber. Filtered-empty (no matches) renders DataViews' built-in empty UI.
 *
 * @param props                  - Component props.
 * @param props.onAddSubscribers - Click handler for the primary CTA.
 * @return Empty-state block.
 */
export default function EmptyState( { onAddSubscribers }: Props ): JSX.Element {
	return (
		<div className="jetpack-subscribers-dashboard__empty">
			<div className="jetpack-subscribers-dashboard__empty-icon" aria-hidden="true">
				✉
			</div>
			<h2 className="jetpack-subscribers-dashboard__empty-title">
				{ __( 'No subscribers yet', 'jetpack-subscribers-dashboard' ) }
			</h2>
			<p className="jetpack-subscribers-dashboard__empty-body">
				{ __(
					'Bring readers in by inviting them by email. They’ll get a confirmation message and start receiving your posts.',
					'jetpack-subscribers-dashboard'
				) }
			</p>
			<Button variant="primary" onClick={ onAddSubscribers }>
				{ __( 'Add subscribers', 'jetpack-subscribers-dashboard' ) }
			</Button>
		</div>
	);
}
