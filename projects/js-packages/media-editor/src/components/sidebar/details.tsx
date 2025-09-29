/**
 * WordPress dependencies
 */
import {
	TextControl,
	TextareaControl,
	PanelBody,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { store as coreStore, useEntityId, type Type } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import type { MediaItem, MediaItemUpdatable } from '../../types';
import AiEditsPanel from './ai-edits';
import { getUnlock } from '../../utils/unlock';

const unlock = getUnlock();
const unlockedAPIs = unlock ? unlock( editorPrivateApis ) : null;
const PostCardPanel = unlockedAPIs?.PostCardPanel;

export default function MediaEditorSidebar() {
	const postId = useEntityId( 'postType', 'attachment' );
	const { post, editedPost, postTypeObject } = useSelect(
		select => {
			const { getEntityRecord, getEditedEntityRecord, getPostType } = select( coreStore );
			return {
				post: getEntityRecord( 'postType', 'attachment', postId, {
					_embed: 'post',
				} ),
				editedPost: getEditedEntityRecord( 'postType', 'attachment', postId ),
				postTypeObject: getPostType( 'attachment' ),
			};
		},
		[ postId ]
	) as {
		post: MediaItem;
		editedPost: MediaItemUpdatable;
		postTypeObject: Type;
	};

	const { editEntityRecord } = useDispatch( coreStore );

	if ( ! post ) {
		return null;
	}

	const handleFieldChange = ( field: string, value: string ) => {
		editEntityRecord( 'postType', 'attachment', postId, { [ field ]: value } );
	};

	return (
		<div className="next-admin-media-editor-sidebar__details">
			<VStack spacing={ 4 }>
				<AiEditsPanel />
				{ editedPost && (
					<>
						{ PostCardPanel && <PostCardPanel postType={ post?.type } postId={ postId } /> }
						<PanelBody title={ __( 'Details', 'media-editor' ) } initialOpen={ true }>
							<VStack spacing={ 3 }>
								<TextControl
									label={ __( 'Title', 'media-editor' ) }
									value={ editedPost.title || '' }
									onChange={ value => handleFieldChange( 'title', value ) }
								/>
								<TextControl
									label={ __( 'Caption', 'media-editor' ) }
									value={ editedPost.caption || '' }
									onChange={ value => handleFieldChange( 'caption', value ) }
								/>
								<TextControl
									label={ __( 'Alternative Text', 'media-editor' ) }
									value={ editedPost.alt_text || '' }
									onChange={ value => handleFieldChange( 'alt_text', value ) }
									help={ __(
										'Describe the purpose of the image. Leave empty if decorative.',
										'media-editor'
									) }
								/>
								<TextareaControl
									label={ __( 'Description', 'media-editor' ) }
									value={ editedPost.description || '' }
									onChange={ value => handleFieldChange( 'description', value ) }
									rows={ 4 }
								/>
							</VStack>
						</PanelBody>
					</>
				) }
			</VStack>
		</div>
	);
}
