import { useCallback } from '@wordpress/element';
import { Connection } from '../../social-store/types';
import { ScheduledPostItem } from './item';
import styles from './list-style.module.scss';

export type ScheduledPostsListProps = {
	items: Array< {
		id: number;
		connection: Connection;
		scheduledAt: number;
	} >;
	onDelete: ( itemId: number ) => void;
	confirmDeletion?: boolean;
};

/**
 * The component to render a list of scheduled posts.
 *
 * @param {ScheduledPostsListProps} props - Component props.
 * @return - React element
 */
export function ScheduledPostsList( {
	items,
	onDelete,
	confirmDeletion = true,
}: ScheduledPostsListProps ) {
	const onDeleteItem = useCallback(
		( itemId: number ) => () => {
			onDelete( itemId );
		},
		[ onDelete ]
	);

	return (
		<ul className={ styles.list }>
			{ items.map( ( { id, connection, scheduledAt } ) => {
				return (
					<li key={ `${ id }` } className={ styles.item }>
						<ScheduledPostItem
							connection={ connection }
							scheduledAt={ scheduledAt }
							onDelete={ onDeleteItem( id ) }
							confirmDeletion={ confirmDeletion }
						/>
					</li>
				);
			} ) }
		</ul>
	);
}
