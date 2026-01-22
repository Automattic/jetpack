import { Flex } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback } from 'react';
import { usePostMeta } from '../../../hooks/use-post-meta';
import { store as socialStore } from '../../../social-store';
import { Connection } from '../../../social-store/types';
import { SharePostForm, SharePostFormProps } from '../../form/share-post-form';
import { ConnectionToggle } from '../connection-toggle';

type PerNetworkCustomizationFormProps = {
	connection: Connection;
};

/**
 * Per-Network Customization Form component.
 *
 * @param {PerNetworkCustomizationFormProps} props - The component props.
 * @return - Per-Network Customization Form component.
 */
export function PerNetworkCustomizationForm( { connection }: PerNetworkCustomizationFormProps ) {
	const { customizeConnectionById } = useDispatch( socialStore );
	const {
		attachedMedia: globalAttachedMedia,
		shareMessage: globalMessage,
		mediaSource: globalMediaSource,
	} = usePostMeta();

	const message = connection.message ?? globalMessage ?? '';
	const attachedMedia = connection.attached_media ?? globalAttachedMedia ?? [];
	const mediaSource = connection.media_source ?? globalMediaSource ?? 'none';

	// Handler for message changes
	const handleMessageChange = useCallback(
		( msg: string ) => {
			customizeConnectionById( connection.connection_id, { message: msg } );
		},
		[ connection.connection_id, customizeConnectionById ]
	);

	// Handler for media changes - only stores attached_media in the override
	const handleMediaChange = useCallback< SharePostFormProps[ 'onMediaChange' ] >(
		updates => {
			customizeConnectionById( connection.connection_id, {
				attached_media: updates.attached_media,
				media_source: updates.media_source,
			} );
		},
		[ connection.connection_id, customizeConnectionById ]
	);

	return (
		<Flex direction="column" gap={ 8 } justify="start">
			<ConnectionToggle connection={ connection } />
			<SharePostForm
				analyticsData={ { location: 'preview-modal' } }
				isInsideNavigatorModal
				disabled={ ! connection.enabled }
				message={ message }
				onMessageChange={ handleMessageChange }
				attachedMedia={ attachedMedia }
				onMediaChange={ handleMediaChange }
				mediaSource={ mediaSource }
				forceMediaAsAttachment
			/>
		</Flex>
	);
}
