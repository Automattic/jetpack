import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { usePerNetworkCustomization } from '../../hooks/use-per-network-customization';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store as socialStore } from '../../social-store';
import styles from './styles.module.scss';

/**
 * Preview Posts Trigger button component.
 *
 * @return - React element
 */
export function PreviewPostsTrigger() {
	const isModalOpen = useSelect( select => select( socialStore ).isUnifiedModalOpen(), [] );
	const { openUnifiedModal } = useDispatch( socialStore );
	const { recordEvent } = useAnalytics();
	const { hasConnections } = useSocialMediaConnections();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );
	const { isPublicizeEnabled, needsUserConnection } = usePublicizeConfig();

	const handleOpenModal = useCallback( () => {
		if ( ! isModalOpen ) {
			recordEvent( 'jetpack_social_preview_modal_opened' );
		}
		openUnifiedModal();
	}, [ isModalOpen, openUnifiedModal, recordEvent ] );

	const buttonLabel = isPostPublished
		? _x(
				'Preview and share',
				'Verb: The button label for the preview modal button',
				'jetpack-publicize-pkg'
		  )
		: _x(
				'Preview and customize',
				'Verb: The button label for the preview modal trigger',
				'jetpack-publicize-pkg'
		  );
	const perNetworkMode = usePerNetworkCustomization();

	if (
		! hasConnections ||
		// Resharing for published posts cannot work without user connection.
		( isPostPublished && needsUserConnection )
	) {
		return null;
	}

	return (
		<>
			<Button
				variant="secondary"
				onClick={ handleOpenModal }
				className={ styles[ 'preview-posts-trigger' ] }
				disabled={ ! isPublicizeEnabled }
			>
				{ buttonLabel }
			</Button>
			{ perNetworkMode.isEnabled ? (
				<p className={ styles[ 'per-network-customization-notice' ] }>
					{ sprintf(
						/* translators: %s: button/section label like "Preview and customize" */
						__( 'Customizing per account. Manage in "%s" above.', 'jetpack-publicize-pkg' ),
						buttonLabel
					) }
				</p>
			) : null }
		</>
	);
}
