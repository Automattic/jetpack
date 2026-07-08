import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useMemo, useCallback } from 'react';
import { store as socialStore } from '../../../social-store';
import { ScreenDetails } from '../types';

/**
 * Hook to get footer actions for sharing activity modal screen.
 *
 * @return footer actions
 */
export function useFooterActions(): ScreenDetails[ 'footerActions' ] {
	const isScreenLocked = useSelect(
		select => select( socialStore ).isUnifiedModalScreenLocked(),
		[]
	);
	const { setUnifiedModalScreenLock } = useDispatch( socialStore );

	const onBack = useCallback(
		( navigate: VoidFunction ) => () => {
			// Reset the screen lock before navigating back
			setUnifiedModalScreenLock( true );
			navigate();
		},
		[ setUnifiedModalScreenLock ]
	);

	return useMemo( () => {
		// Show "Back" button only when not screen locked (i.e., navigated from within the modal)
		if ( ! isScreenLocked ) {
			return [
				( { navigate } ) => (
					<Button key="back" variant="secondary" onClick={ onBack( navigate ) }>
						{ __( 'Done', 'jetpack-publicize-pkg' ) }
					</Button>
				),
			];
		}

		return [];
	}, [ isScreenLocked, onBack ] );
}
