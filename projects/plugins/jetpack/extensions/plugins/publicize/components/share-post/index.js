/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, PanelRow } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useSharePost from '../../hooks/use-share-post';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import usePublicizeConfig from '../../hooks/use-publicize-config';

export function SharePostButton( { isPublicizeEnabled } ) {
	const { createErrorNotice, removeNotice, createSuccessNotice } = useDispatch( noticesStore );
	const { savePost } = useDispatch( editorStore );
	const { hasEnabledConnections } = useSocialMediaConnections();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );
	const shouldSavePost = useSelect( select => select( editorStore ).isEditedPostDirty(), [] );

	const { isFetching, isError, isSucess, data, error, doPublicize } = useSharePost();

	const showErrorMessage = useCallback(
		function () {
			createErrorNotice( error.message, {
				id: 'publicize-post-share-message',
			} );
		},
		[ error.message, createErrorNotice ]
	);

	const showSuccessMessage = useCallback(
		function () {
			createSuccessNotice( __( 'Post shared', 'jetpack' ), {
				id: 'publicize-post-share-message',
				type: 'snackbar',
				actions: data.map( ( { url } ) => ( { url, label: 'View' } ) ),
			} );
		},
		[ data, createSuccessNotice ]
	);

	useEffect( () => {
		if ( isFetching ) {
			return;
		}

		if ( isError ) {
			return showErrorMessage();
		}

		if ( ! isSucess ) {
			return;
		}

		showSuccessMessage();
	}, [ isFetching, isError, isSucess, showErrorMessage, showSuccessMessage ] );

	/*
	 * Disabled button when
	 * - sharing is disabled
	 * - no enabled connections
	 * - post is not published
	 * - is sharing post
	 */
	const isButtonDisabled =
		! isPublicizeEnabled || ! hasEnabledConnections || ! isPostPublished || isFetching;

	return (
		<Button
			isSecondary
			onClick={ function () {
				if ( ! isPostPublished ) {
					return createErrorNotice(
						__( 'You must publish your post before you can share it.', 'jetpack' )
					);
				}

				removeNotice( 'publicize-post-share-message' );

				// Should save post before sharing?
				if ( ! shouldSavePost ) {
					return doPublicize();
				}

				// Save post before sharing.
				savePost().then( doPublicize );
			} }
			disabled={ isButtonDisabled }
			isBusy={ isFetching }
		>
			{ __( 'Share post', 'jetpack' ) }
		</Button>
	);
}

export function SharePostRow( { isPublicizeEnabled } ) {
	const { isRePublicizeFeatureEnabled } = usePublicizeConfig();

	if ( ! isRePublicizeFeatureEnabled ) {
		return null;
	}

	return (
		<PanelRow>
			<SharePostButton isPublicizeEnabled={ isPublicizeEnabled } />
		</PanelRow>
	);
}
