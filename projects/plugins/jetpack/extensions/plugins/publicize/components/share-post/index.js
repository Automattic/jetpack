/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, PanelRow } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useSharePost from '../../hooks/use-share-post';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import usePublicizeConfig from '../../hooks/use-publicize-config';

export function SharePostButton( { isPublicizeEnabled } ) {
	const { createErrorNotice, removeNotice, createSuccessNotice } = useDispatch( noticesStore );
	const { hasEnabledConnections } = useSocialMediaConnections();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	const { isFetching, isError, isSuccess, doPublicize } = useSharePost();

	useEffect( () => {
		if ( isFetching ) {
			return;
		}

		if ( isError ) {
			return createErrorNotice( __( 'Unable to share the Post', 'jetpack' ), {
				id: 'publicize-post-share-message',
			} );
		}

		if ( ! isSuccess ) {
			return;
		}

		createSuccessNotice( __( 'Post shared', 'jetpack' ), {
			id: 'publicize-post-share-message',
			type: 'snackbar',
		} );
	}, [ isFetching, isError, isSuccess, createErrorNotice, createSuccessNotice ] );

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
				doPublicize();
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
