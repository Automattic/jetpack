import { Button } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';

type MarkAsSharedProps = {
	connection: Connection;
};

/**
 * Mark as shared component
 *
 * @param {MarkAsSharedProps} props - component props
 *
 * @returns {import('react').ReactNode} - React element
 */
export function MarkAsShared( { connection }: MarkAsSharedProps ) {
	const { updateConnectionById } = useDispatch( socialStore );

	const { isUpdating } = useSelect(
		select => {
			const { getUpdatingConnections } = select( socialStore );

			return {
				isUpdating: getUpdatingConnections().includes( connection.connection_id ),
			};
		},
		[ connection.connection_id ]
	);

	const onClick = useCallback( async () => {
		await updateConnectionById( connection.connection_id, {
			shared: ! connection.shared,
		} );
	}, [ connection.connection_id, connection.shared, updateConnectionById ] );

	return (
		<Button
			size="small"
			variant="secondary"
			disabled={ isUpdating }
			onClick={ onClick }
			isLoading={ isUpdating }
		>
			{ connection.shared
				? __( 'Mark as not shared', 'jetpack' )
				: _x(
						'Mark as shared',
						'Make a connection available to other admins, authors etc.',
						'jetpack'
				  ) }
		</Button>
	);
}
