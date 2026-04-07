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
export function useModalScreen() {
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	const footerActions = useFooterActions();

	const isPrePublishScreen = useSelect( select => {
		const store = select( editorStore );
		return ! store.isCurrentPostPublished() && store.isPublishSidebarOpened();
	}, [] );

	// useMemo not really needed but it encapsulates the logic.
	const title = useMemo( () => {
		if ( isPrePublishScreen ) {
			return _x(
				'Confirm social sharing',
				'Modal title for pre-publish confirmation',
				'jetpack-publicize-pkg'
			);
		}

		if ( isPostPublished ) {
			return __( 'Customize and share to social media', 'jetpack-publicize-pkg' );
		}

		return _x(
			'Preview and customize',
			'Title for social post preview modal',
			'jetpack-publicize-pkg'
		);
	}, [ isPrePublishScreen, isPostPublished ] );

	return useMemo< ScreenDetails >(
		() => ( {
			path: '/',
			title,
			isScreenLocked: true,
			headerIcon: isPrePublishScreen ? <JetpackLogo /> : null,
			content: <Content />,
			footerContent: <FooterContent />,
			footerActions,
			className: styles[ 'social-post-preview-screen' ],
			'data-plan': hasSocialPaidFeatures() ? 'paid' : 'free',
		} ),
		[ isPrePublishScreen, footerActions, title ]
	);
}
