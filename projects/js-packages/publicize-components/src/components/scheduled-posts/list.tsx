import { useCallback } from '@wordpress/element';
import { _x } from '@wordpress/i18n';
import { Connection } from '../../social-store/types';
import { ScheduledPostItem } from './item';
import styles from './list-style.module.scss';

export type ScheduledPostsListProps = {
	items: Array< {
		connection: Connection;
		scheduledAt: string;
	} >;
	onDelete: ( connectionId: string ) => void;
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
		( connectionId: string ) => () => {
			onDelete( connectionId );
		},
		[ onDelete ]
	);

	return (
		<section className={ styles.wrapper }>
			<h4 className={ styles.title }>
				{ _x(
					'Upcoming shares',
					'Upcoming posts scheduled for sharing.',
					'jetpack-publicize-components'
				) }
			</h4>
			<ul className={ styles.list }>
				{ items.map( ( { connection, scheduledAt } ) => {
					return (
						<li key={ scheduledAt } className={ styles.item }>
							<ScheduledPostItem
								connection={ connection }
								scheduledAt={ scheduledAt }
								onDelete={ onDeleteItem( connection.connection_id ) }
								confirmDeletion={ confirmDeletion }
							/>
						</li>
					);
				} ) }
			</ul>
		</section>
	);
}
