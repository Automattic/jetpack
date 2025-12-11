import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../../social-store';

/**
 * Edit Template Button component.
 *
 * @return - React element
 */
export function EditTemplate() {
	const { openUnifiedModal } = useDispatch( socialStore );

	const handleOpenModal = useCallback( () => {
		// When opening modal from the sidebar, we want to lock the screen to prevent navigation.
		openUnifiedModal( { initialPath: '/edit-template', isScreenLocked: true } );
	}, [ openUnifiedModal ] );

	return (
		<Button variant="secondary" onClick={ handleOpenModal }>
			{ __( 'Edit template', 'jetpack-publicize-components' ) }
		</Button>
	);
}
