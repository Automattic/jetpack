import {
	Button,
	Modal,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useState } from 'react';
import wpcomRequest from 'wpcom-proxy-request';
import { type Viewer } from './use-viewers';

type RemoveViewerModalProps = {
	onClose: () => void;
	viewer: Viewer | null;
	siteId: number;
	onRemoveSuccess: () => void;
	addNotice: ( id: string, content: string ) => void;
};

/**
 * Modal for confirming viewer removal.
 *
 * @param {RemoveViewerModalProps} props - Component props.
 * @return {JSX.Element|null} The modal component or null if not open.
 */
export function RemoveViewerModal( {
	onClose,
	viewer,
	siteId,
	onRemoveSuccess,
	addNotice,
}: RemoveViewerModalProps ) {
	const [ isRemoving, setIsRemoving ] = useState( false );

	const handleRemoveViewer = async () => {
		if ( ! viewer ) {
			return;
		}

		setIsRemoving( true );
		try {
			// Delete the viewer only if they are active
			if ( viewer.status === 'active' ) {
				await wpcomRequest( {
					path: `/sites/${ siteId }/viewers/${ viewer.userId }/delete`,
					apiVersion: '1.1',
					method: 'POST',
				} );
			}

			// Delete the invite
			await wpcomRequest( {
				path: `/sites/${ siteId }/invites/delete`,
				apiNamespace: 'wpcom/v2',
				apiVersion: '2',
				method: 'POST',
				body: {
					invite_ids: [ viewer.inviteId ],
				},
			} );

			onClose();
			onRemoveSuccess();
			addNotice( 'viewer-removed', __( 'Viewer removed', 'jetpack-mu-wpcom' ) );
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch ( error ) {
			addNotice( 'viewer-remove-error', __( 'Failed to remove viewer', 'jetpack-mu-wpcom' ) );
		} finally {
			setIsRemoving( false );
		}
	};

	if ( ! viewer ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Remove viewer', 'jetpack-mu-wpcom' ) }
			onRequestClose={ onClose }
			size="medium"
		>
			<VStack spacing={ 4 }>
				<Text>
					{ createInterpolateElement(
						sprintf(
							/* translators: %s is the username of the viewer being removed */
							__(
								'Are you sure you want to remove the viewer <strong>%s</strong>? They will not be able to visit this site.',
								'jetpack-mu-wpcom'
							),
							viewer.username
						),
						{
							strong: <strong />,
						}
					) }
				</Text>
				<HStack spacing={ 2 } alignment="right">
					<Button variant="secondary" onClick={ onClose } disabled={ isRemoving }>
						{ __( 'Cancel', 'jetpack-mu-wpcom' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ handleRemoveViewer }
						isBusy={ isRemoving }
						disabled={ isRemoving }
					>
						{ __( 'Remove', 'jetpack-mu-wpcom' ) }
					</Button>
				</HStack>
			</VStack>
		</Modal>
	);
}
