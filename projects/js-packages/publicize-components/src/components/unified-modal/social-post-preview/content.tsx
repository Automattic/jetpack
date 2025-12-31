import { Flex } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect } from 'react';
import { useConnectionOverrides } from '../../../hooks/use-connection-overrides';
import { usePostMeta } from '../../../hooks/use-post-meta';
import { store as socialStore } from '../../../social-store';
import { Connection } from '../../../social-store/types';
import { MediaValidationNotices } from '../../form/media-validation-notices';
import { SharePostForm } from '../../form/share-post-form';
import { PostPreview } from '../../social-post-modal/post-preview';
import { ConnectionPanels } from './connection-panels';
import { ScheduledPosts } from './scheduled-posts';
import styles from './styles.module.scss';
import type { AttachedMedia } from '../../../utils/types';

type ContentProps = {
	baseId: string;
	selectedConnection: Connection;
	forSmallScreen?: boolean;
};

/**
 * Content component for the social preview modal.
 *
 * @param {ContentProps} props - The component props.
 * @return - Content component.
 */
export function Content( { baseId, selectedConnection, forSmallScreen }: ContentProps ) {
	const { incrementRenderCountFor } = useDispatch( socialStore );
	const { shareMessage, attachedMedia } = usePostMeta();
	const { getConnectionOverride, hasOverride, updateConnectionOverride, toggleOverride } =
		useConnectionOverrides();

	const connectionId = selectedConnection.connection_id;
	const isCustomizeEnabled = hasOverride( connectionId );
	const override = getConnectionOverride( connectionId );

	// Get the effective message and media values (override or global)
	const effectiveMessage = isCustomizeEnabled ? override?.message ?? '' : shareMessage;
	const effectiveAttachedMedia = isCustomizeEnabled
		? override?.attached_media ?? []
		: attachedMedia;

	// Handler for message changes
	const handleMessageChange = useCallback(
		( message: string ) => {
			updateConnectionOverride( connectionId, { message } );
		},
		[ connectionId, updateConnectionOverride ]
	);

	// Handler for media changes - only stores attached_media in the override
	const handleMediaChange = useCallback(
		( updates: { attached_media?: Array< AttachedMedia > } ) => {
			updateConnectionOverride( connectionId, {
				attached_media: updates.attached_media,
			} );
		},
		[ connectionId, updateConnectionOverride ]
	);

	// Handler for customize toggle
	const handleCustomizeToggle = useCallback( () => {
		toggleOverride( connectionId, {
			message: shareMessage,
			attached_media: attachedMedia,
		} );
	}, [ connectionId, toggleOverride, shareMessage, attachedMedia ] );

	useEffect( () => {
		incrementRenderCountFor( 'social-preview' );
	}, [ incrementRenderCountFor ] );

	if ( forSmallScreen ) {
		return (
			<div className={ styles.content }>
				<Flex direction="column" gap={ 0 }>
					<ConnectionPanels />
					<div className={ styles[ 'notice-wrapper' ] }>
						<MediaValidationNotices />
					</div>
					<div className={ styles[ 'customization-form' ] }>
						<SharePostForm
							analyticsData={ { location: 'preview-modal' } }
							isInsideNavigatorModal
							showCustomizeToggle
							isCustomizeEnabled={ isCustomizeEnabled }
							onCustomizeToggle={ handleCustomizeToggle }
							message={ effectiveMessage }
							onMessageChange={ isCustomizeEnabled ? handleMessageChange : undefined }
							attachedMedia={ effectiveAttachedMedia }
							onMediaChange={ isCustomizeEnabled ? handleMediaChange : undefined }
						/>
					</div>
					<ScheduledPosts />
				</Flex>
			</div>
		);
	}

	return (
		<div
			className={ styles.content }
			role="tabpanel"
			tabIndex={ 0 }
			id={ `${ baseId }-preview-content-${ selectedConnection.connection_id }` }
			aria-labelledby={ `${ baseId }-preview-tab-${ selectedConnection.connection_id }` }
		>
			{ selectedConnection.enabled ? (
				<Flex className={ styles.preview } align="center" justify="center">
					<div className={ styles[ 'customization-form' ] }>
						<SharePostForm
							analyticsData={ { location: 'preview-modal' } }
							isInsideNavigatorModal
							showCustomizeToggle
							isCustomizeEnabled={ isCustomizeEnabled }
							onCustomizeToggle={ handleCustomizeToggle }
							message={ effectiveMessage }
							onMessageChange={ isCustomizeEnabled ? handleMessageChange : undefined }
							attachedMedia={ effectiveAttachedMedia }
							onMediaChange={ isCustomizeEnabled ? handleMediaChange : undefined }
						/>
					</div>
					<PostPreview connection={ selectedConnection } />
				</Flex>
			) : (
				<Flex className={ styles[ 'inactive-preview' ] } align="center" justify="center">
					<p>{ __( 'Enable this account to see the preview.', 'jetpack-publicize-components' ) }</p>
				</Flex>
			) }
		</div>
	);
}
