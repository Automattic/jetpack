import { useDispatch } from '@wordpress/data';
import { useEffect } from 'react';
import { store as socialStore } from '../../../social-store';
import { CustomizeAndPreview } from '../../customize-and-preview';

/**
 * Content component for the social preview modal.
 *
 * @return - Content component.
 */
export function Content() {
	const { incrementRenderCountFor } = useDispatch( socialStore );

	useEffect( () => {
		incrementRenderCountFor( 'social-preview' );
	}, [ incrementRenderCountFor ] );

	return <CustomizeAndPreview />;
}
