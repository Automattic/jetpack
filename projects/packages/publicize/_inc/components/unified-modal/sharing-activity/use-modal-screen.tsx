import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { ScreenDetails } from '../types';
import { Content } from './content';

/**
 * Hook to get modal screen details for sharing activity.
 *
 * @return screen details
 */
export function useModalScreen(): ScreenDetails {
	return useMemo(
		() => ( {
			path: '/sharing-activity',
			title: __( 'Sharing activity', 'jetpack-publicize-pkg' ),
			isScreenLocked: true,
			content: <Content />,
		} ),
		[]
	);
}
