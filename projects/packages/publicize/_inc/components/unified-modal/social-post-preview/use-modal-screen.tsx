import { JetpackLogo } from '@automattic/jetpack-shared-extension-utils/icons';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, _x } from '@wordpress/i18n';
import { useMemo } from 'react';
import { hasSocialPaidFeatures } from '../../../utils';
import { ScreenDetails } from '../types';
import { Content } from './content';
import { FooterContent } from './footer-content';
import styles from './styles.module.scss';
import { useFooterActions } from './use-footer-actions';

/**
 * Hook to get modal screen details for social post preview.
 *
 * @return screen details
 */
export function useModalScreen(): ScreenDetails {
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
				? __( 'Preview and customize', 'jetpack-publicize-pkg' )
				: _x(
						'Customize and share to social media',
						'Share here is imperative verb',
						'jetpack-publicize-pkg'
				  ),
			isScreenLocked: true,
			headerIcon: isPrePublishScreen ? <JetpackLogo /> : null,
			content: <Content />,
			footerContent: <FooterContent />,
			footerActions,
			className: styles[ 'social-post-preview-screen' ],
			'data-plan': hasSocialPaidFeatures() ? 'paid' : 'free',
		} ),
		[ isPostPublished, isPrePublishScreen, footerActions ]
	);
}
