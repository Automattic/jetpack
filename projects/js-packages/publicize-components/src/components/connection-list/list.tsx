import { useCallback } from '@wordpress/element';
import { Connection } from '../../social-store/types';
import { ConnectionListItem } from './item';
import styles from './list-style.module.scss';

export type ConnectionListProps = {
	connections: Array< Connection >;
	onToggle: ( connectionId: string ) => void;
	title?: string;
};

/**
 * The component to render a list of social media connections.
 *
 * @param {ConnectionListProps} props - Component props.
 * @return {JSX.Element} - React element
 */
export function ConnectionList( { connections, onToggle, title = null }: ConnectionListProps ) {
	const onConnectionToggle = useCallback(
		( connectionId: string ) => () => {
			onToggle( connectionId );
		},
		[ onToggle ]
	);

	return (
		<section className={ styles.wrapper }>
			{ title && <h4 className={ styles.title }>{ title }</h4> }
			<ul className={ styles.list }>
				{ connections.map( connection => {
					return (
						<li key={ connection.connection_id } className={ styles.item }>
							<ConnectionListItem
								connection={ connection }
								onToggle={ onConnectionToggle( connection.connection_id ) }
							/>
						</li>
					);
				} ) }
			</ul>
		</section>
	);
}
