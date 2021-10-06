/**
 * WordPress dependencies
 */
import { Button, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { useSharePost } from '../../hooks/use-share-post';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';

export function SharePostButton() {
	const { createErrorNotice, removeNotice, createSuccessNotice } = useDispatch( noticesStore );
	const { savePost } = useDispatch( editorStore );
	const [ isSharing, setIsSharing ] = useState( false );
	const { hasEnabledConnections } = useSocialMediaConnections();

	const onPostShareHander = useSharePost( function ( error, results ) {
		if ( error ) {
			createErrorNotice( error.message, {
				id: 'publicize-post-share-message',
			} );
		} else if ( results.shared?.length ) {
			createSuccessNotice( __( 'Post shared', 'jetpack' ), {
				id: 'publicize-post-share-message',
				type: 'snackbar',
				actions: results.shared.map( ( { url } ) => ( { url, label: 'View' } ) ),
			} );
		}

		setIsSharing( false );
	} );

	return (
		<Button
			isSecondary
			onClick={ function () {
				savePost();
				setIsSharing( true );
				removeNotice( 'publicize-post-share-message' );
				/*
				 * @ToDo:
				 * We need to ensure that the post is saved before sharing,
				 * using the `usePostJustSaved` hook.
				 */
				onPostShareHander();
			} }
			disabled={ isSharing || ! hasEnabledConnections }
			isBusy={ isSharing }
		>
			{ __( 'Share post', 'jetpack' ) }
		</Button>
	);
}

export function SharePostRow( { isEnabled } ) {
	if ( ! isEnabled ) {
		return null;
	}

	return (
		<PanelRow>
			<SharePostButton />
		</PanelRow>
	);
}
