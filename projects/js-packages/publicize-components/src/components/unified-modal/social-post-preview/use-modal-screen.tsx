import { useBreakpoint } from '@automattic/viewport-react';
import { __ } from '@wordpress/i18n';
import { useId, useMemo, useState } from 'react';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { Connection } from '../../../social-store/types';
import { ScreenDetails } from '../types';
import { Content } from './content';
import { FooterContent } from './footer-content';
import { Sidebar } from './sidebar';

/**
 * Hook to get modal screen details for social post preview.
 *
 * @return screen details
 */
export function useModalScreen(): ScreenDetails {
	const { connections } = useSocialMediaConnections();

	const [ selectedConnection, setSelectedConnection ] = useState< Connection >( connections[ 0 ] );

	const baseId = useId();
	const isSmallScreen = useBreakpoint( '<660px' );

	return useMemo(
		() => ( {
			path: '/',
			title: __( 'Preview and customize', 'jetpack-publicize-components' ),
			isScreenLocked: true,
			sidebar: isSmallScreen ? null : (
				<Sidebar
					baseId={ baseId }
					onSelectConnection={ setSelectedConnection }
					selectedConnection={ selectedConnection }
				/>
			),
			content: (
				<Content
					baseId={ baseId }
					selectedConnection={ selectedConnection }
					forSmallScreen={ isSmallScreen }
				/>
			),
			footerContent: <FooterContent />,
			footerActions: [
				// TODO: Add resharing buttons here conditionally
				{
					text: __( 'Save Changes', 'jetpack-publicize-components' ),
					variant: 'primary',
				},
			],
		} ),
		[ isSmallScreen, baseId, selectedConnection ]
	);
}
