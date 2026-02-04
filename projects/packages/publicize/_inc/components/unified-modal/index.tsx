import { NavigatorModal, ThemeProvider } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from 'react';
import { store as socialStore } from '../../social-store';
import { useModalScreen as useEditTemplateModalScreen } from './edit-template/use-modal-screen';
import { useModalScreen as useSharingActivityModalScreen } from './sharing-activity/use-modal-screen';
import { useModalScreen as useSocialPostPreviewModalScreen } from './social-post-preview/use-modal-screen';
import styles from './styles.module.scss';

/**
 * Themed Unified Modal component.
 *
 * @return - Themed Unified Modal component.
 */
function ThemedUnifiedModal() {
	const initialPath = useSelect( select => select( socialStore ).getUnifiedModalInitialPath(), [] );

	const socialPostPreviewModalScreen = useSocialPostPreviewModalScreen();
	const editTemplateModalScreen = useEditTemplateModalScreen();
	const sharingActivityModalScreen = useSharingActivityModalScreen();

	const { closeUnifiedModal } = useDispatch( socialStore );

	const onClose = useCallback( () => {
		closeUnifiedModal( { isScreenLocked: false, initialPath: '/' } );
	}, [ closeUnifiedModal ] );

	return (
		<ThemeProvider targetDom={ document.body }>
			<NavigatorModal
				className={ styles[ 'unified-modal' ] }
				initialPath={ initialPath || '/' }
				onClose={ onClose }
				size="fill"
			>
				<NavigatorModal.Screen { ...socialPostPreviewModalScreen } />
				<NavigatorModal.Screen { ...editTemplateModalScreen } />
				<NavigatorModal.Screen { ...sharingActivityModalScreen } />
				{ /* Generate with AI screen goes here */ }
			</NavigatorModal>
		</ThemeProvider>
	);
}

/**
 * Unified Modal for Social UI
 *
 * @return - React element
 */
export function UnifiedModal() {
	const shouldModalBeOpen = useSelect( select => select( socialStore ).isUnifiedModalOpen(), [] );

	if ( ! shouldModalBeOpen ) {
		return null;
	}

	return <ThemedUnifiedModal />;
}
