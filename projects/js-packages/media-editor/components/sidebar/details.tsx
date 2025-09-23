/**
 * WordPress dependencies
 */
// TODO: Replace with available data views
// import { DataForm } from '@wordpress/dataviews/wp';
import { __experimentalVStack as Stack } from '@wordpress/components';
import { store as coreStore, useEntityId, type Type } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
// TODO: Replace with available alternative
// import { unlock } from '@wordpress/admin-toolkit';
// TODO: Replace with available fields implementation
// import { usePostFields } from '@wordpress/fields-next';

/**
 * Internal dependencies
 */
import type { MediaItem, MediaItemUpdatable } from '../../types';

// Unlock WordPress private APIs
// TODO: Replace with available alternative
// const { PostCardPanel } = unlock( editorPrivateApis );
const PostCardPanel = ( { postType, postId }: any ) => <div>Post Card Panel</div>;

/**
 *
 */
export default function MediaEditorSidebar() {
	const postId = useEntityId( 'postType', 'attachment' );
	const { post, editedPost, postTypeObject } = useSelect(
		select => {
			const { getEntityRecord, getEditedEntityRecord } = select( coreStore ) as any;
			return {
				post: getEntityRecord( 'postType', 'attachment', postId ),
				editedPost: getEditedEntityRecord( 'postType', 'attachment', postId ),
				postTypeObject: { quick_edit_form: null } as any,
			};
		},
		[ postId ]
	) as {
		post: MediaItem;
		editedPost: MediaItemUpdatable;
		postTypeObject: Type;
	};

	// TODO: Replace with available fields implementation
	// const { fields } = usePostFields( { postType: 'attachment' } );
	const fields: any[] = [];
	const form = ( postTypeObject as any )?.quick_edit_form;

	const { editEntityRecord } = useDispatch( coreStore ) as any;
	// Record< string, any > matches the type of the `edits` parameter of the `DataForm.onChange` prop.
	const edit = ( edits: Record< string, any > ) => {
		editEntityRecord( 'postType', 'attachment', postId, edits );
	};

	if ( ! post ) {
		return null;
	}

	return (
		<div className="next-admin-media-editor-sidebar__details">
			<Stack direction="column" gap={ 4 }>
				{ editedPost && (
					<>
						<PostCardPanel postType={ post?.type } postId={ postId } />
						{ /* TODO: Replace with available data views
						{ !! form && fields.length > 0 && (
							<DataForm
								data={ editedPost }
								fields={ fields }
								form={ form }
								onChange={ edit }
							/>
						) }
						*/ }
					</>
				) }
			</Stack>
		</div>
	);
}
