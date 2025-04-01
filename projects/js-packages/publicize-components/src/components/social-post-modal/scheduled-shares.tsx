import { PanelBody, PanelRow, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { _x, sprintf } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { ScheduledPostsList } from '../scheduled-posts/list';
import styles from './scheduled-shares-styles.module.scss';

export type ScheduledSharesProps = {
	postId: number;
};

/**
 * ScheduledShares component.
 *
 * @param {ScheduledSharesProps} props - Component props.
 *
 * @return - React element
 */
export function ScheduledShares( { postId }: ScheduledSharesProps ) {
	const isFetching = useSelect(
		select => select( socialStore ).isFetchingScheduledSharesForPost( postId ),
		[ postId ]
	);

	const { deleteScheduledShare } = useDispatch( socialStore );

	const { getConnectionById, isDeletingScheduledShare } = useSelect( socialStore, [] );

	const scheduledShares = useSelect(
		select => select( socialStore ).getScheduledSharesForPost( postId ),
		[ postId ]
	);

	const items = useMemo( () => {
		return (
			scheduledShares
				.map( ( { id, connection_id, timestamp } ) => {
					return {
						id,
						connection: getConnectionById( connection_id.toString() ),
						scheduledAt: timestamp,
					};
				} )
				// Filter out items without a connection and items that are being deleted.
				.filter( ( { id, connection } ) => connection && ! isDeletingScheduledShare( id ) )
		);
	}, [ getConnectionById, isDeletingScheduledShare, scheduledShares ] );

	// We want to show the spinner only at the beginning, when we don't have any items yet.
	// We don't want to show it after the list gets refreshed after an item is deleted.
	const showLoadingIndicator = isFetching && ! items.length;

	const panelTitle = showLoadingIndicator
		? _x(
				'Scheduled (Loading…)',
				'Scheduled posts/shares items being loaded.',
				'jetpack-publicize-components'
		  )
		: sprintf(
				/* translators: %d: number of scheduled posts */
				_x( 'Scheduled (%d)', 'Scheduled posts/shares items', 'jetpack-publicize-components' ),
				items.length
		  );

	return (
		<PanelBody title={ panelTitle } initialOpen={ false }>
			<PanelRow>
				{ ( () => {
					if ( showLoadingIndicator ) {
						return <Spinner />;
					}

					if ( ! items.length ) {
						return (
							<p className={ styles.empty }>
								{ _x(
									'No upcoming shares',
									'No upcoming posts scheduled for sharing.',
									'jetpack-publicize-components'
								) }
							</p>
						);
					}

					return (
						<section className={ styles.wrapper }>
							<h4 className={ styles.title }>
								{ _x(
									'Upcoming shares',
									'Upcoming posts scheduled for sharing.',
									'jetpack-publicize-components'
								) }
							</h4>
							<ScheduledPostsList items={ items } onDelete={ deleteScheduledShare } />
						</section>
					);
				} )() }
			</PanelRow>
		</PanelBody>
	);
}
