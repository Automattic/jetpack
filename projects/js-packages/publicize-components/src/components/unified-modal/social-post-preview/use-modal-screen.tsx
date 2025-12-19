import { JetpackLogo } from '@automattic/jetpack-shared-extension-utils/icons';
import { useBreakpoint } from '@automattic/viewport-react';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, _x } from '@wordpress/i18n';
import { useId, useMemo, useState } from 'react';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { Connection } from '../../../social-store/types';
import { ScreenDetails } from '../types';
import { Content } from './content';
import { FooterContent } from './footer-content';
import { Sidebar } from './sidebar';
import { useFooterActions } from './use-footer-actions';

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
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	const footerActions = useFooterActions();

	const isPrePublishScreen = useSelect( select => {
		const store = select( editorStore );
		return ! store.isCurrentPostPublished() && store.isPublishSidebarOpened();
	}, [] );

	return useMemo(
		() => ( {
			path: '/',
			title: ! isPostPublished
				? __( 'Preview and customize', 'jetpack-publicize-components' )
				: _x(
						'Customize and share to social media',
						'Share here is imperative verb',
						'jetpack-publicize-components'
				  ),
			isScreenLocked: true,
			headerIcon: isPrePublishScreen ? <JetpackLogo /> : null,
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
			footerActions,
		} ),
		[
			isPostPublished,
			isPrePublishScreen,
			isSmallScreen,
			baseId,
			selectedConnection,
			footerActions,
		]
	);
}
