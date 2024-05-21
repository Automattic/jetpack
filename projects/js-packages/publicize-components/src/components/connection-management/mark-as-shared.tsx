import { CheckboxControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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

	const onChange = useCallback(
		( shared: boolean ) => {
			updateConnectionById( connection.connection_id, {
				shared,
			} );
		},
		[ connection.connection_id, updateConnectionById ]
	);

	return (
		<CheckboxControl
			checked={ connection.shared ?? false }
			onChange={ onChange }
			disabled={ isUpdating || connection.status === 'broken' }
			label={ __( 'Mark the connection as shared', 'jetpack' ) }
		/>
	);
}
