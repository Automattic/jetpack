import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { BlockIcon, useBlockProps } from '@wordpress/block-editor';
//import { Placeholder, withNotices } from '@wordpress/components';
import { Placeholder } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
//import { useState } from '@wordpress/element';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';
import './editor.scss';
import useFetchPostLikes from './use-fetch-post-likes';

const icon = getBlockIconComponent( metadata );

//function LikeEdit( { attributes, className, noticeOperations, noticeUI, setAttributes } ) {
function LikeEdit( { noticeUI } ) {
	/**
	 * Write the block editor UI.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */
	//const [ notice, setNotice ] = useState();

	/* Call this function when you want to show an error in the placeholder. */
	/* const setErrorNotice = () => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( __( 'Put error message here.', 'jetpack' ) );
	}; */

	const blockProps = useBlockProps();
	//const blogId = container.getAttribute( 'data-blog-id' );
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );
	const blogId = useSelect( select => select( CONNECTION_STORE_ID ).getBlogId() );
	//console.log( postId );
	//console.log( blogId );
	const { fetchLikes } = useFetchPostLikes( blogId, postId );

	//console.log( 'isLoading', isLoading );
	//console.log( 'error', error );
	//console.log( 'likes', likes );

	// useEffect that will fetch the likes
	useEffect( () => {
		fetchLikes();
	}, [ fetchLikes ] );

	return (
		<div { ...blockProps }>
			<Placeholder
				label={ __( 'Like', 'jetpack' ) }
				instructions={ __( 'Instructions go here.', 'jetpack' ) }
				icon={ <BlockIcon icon={ icon } /> }
				notices={ noticeUI }
			>
				{ __( 'User input goes here?', 'jetpack' ) }
			</Placeholder>
		</div>
	);
}

export default LikeEdit;
