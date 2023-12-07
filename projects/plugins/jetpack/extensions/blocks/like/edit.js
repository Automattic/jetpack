import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { BlockIcon, useBlockProps, InspectorControls } from '@wordpress/block-editor';
//import { Placeholder, withNotices } from '@wordpress/components';
import { Placeholder, ToggleControl, PanelBody } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';
import './editor.scss';
//import useFetchReblogSetting from './use-fetch-reblog-setting';

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
	const [ hasFixedBackground, setHasFixedBackground ] = useState( false );

	//console.log( window?.Jetpack_LikeBlock_BlogId );
	//console.log( 'blogId', blogId );

	//const { fetchReblogSetting, reblogSetting } = useFetchReblogSetting( blogId );

	//useEffect( () => {
	//	fetchReblogSetting();
	//}, [ fetchReblogSetting ] );

	//console.log( 'reblogSetting', reblogSetting );

	return (
		<div { ...blockProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack' ) }>
					<ToggleControl
						label="Show reblog button"
						help={ hasFixedBackground ? 'Has fixed background.' : 'No fixed background.' }
						checked={ hasFixedBackground }
						onChange={ newValue => {
							setHasFixedBackground( newValue );
						} }
					/>
				</PanelBody>
			</InspectorControls>
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
