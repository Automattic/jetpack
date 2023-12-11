import { useBlockProps } from '@wordpress/block-editor';
//import { Placeholder, withNotices } from '@wordpress/components';
//import { useState } from '@wordpress/element';
import ServerSideRender from '@wordpress/server-side-render';
import './editor.scss';

//function LikeEdit( { attributes, className, noticeOperations, noticeUI, setAttributes } ) {
function LikeEdit() {
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

	return (
		<div { ...blockProps }>
			<ServerSideRender block="jetpack/like" />
		</div>
	);
}

export default LikeEdit;
