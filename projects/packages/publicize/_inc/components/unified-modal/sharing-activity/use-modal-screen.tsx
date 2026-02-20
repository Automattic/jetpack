import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { store as socialStore } from '../../../social-store';
import { ScreenDetails } from '../types';
import { Content } from './content';
import { useFooterActions } from './use-footer-actions';

/**
 * Hook to get modal screen details for sharing activity.
 *
 * @return screen details
 */
export function useModalScreen() {
	const isScreenLocked = useSelect(
		select => select( socialStore ).isUnifiedModalScreenLocked(),
		[]
	);
	const footerActions = useFooterActions();

	return useMemo< ScreenDetails >(
		() => ( {
			path: '/sharing-activity',
			title: __( 'Sharing activity', 'jetpack-publicize-pkg' ),
			isScreenLocked,
			footerActions,
			content: <Content />,
		} ),
		[ footerActions, isScreenLocked ]
	);
}
