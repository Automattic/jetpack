import { getBlockIconComponent, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { BlockIcon, useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { Placeholder, ToggleControl, PanelBody } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';
import './editor.scss';
import useFetchReblogSetting from './use-fetch-reblog-setting';

const icon = getBlockIconComponent( metadata );

function LikeEdit( { noticeUI } ) {
	const blockProps = useBlockProps();
	const blogId = window?.Jetpack_LikeBlock?.blog_id;

	const { fetchReblogSetting, reblogSetting } = useFetchReblogSetting( blogId );

	const setReblogSetting = newValue => {
		// eslint-disable-next-line no-console
		console.log( newValue );
	};

	useEffect( () => {
		if ( ! isSimpleSite() ) {
			return;
		}
		fetchReblogSetting();
	}, [ fetchReblogSetting ] );

	return (
		<div { ...blockProps }>
			{ isSimpleSite() && (
				<InspectorControls>
					<PanelBody title={ __( 'Settings', 'jetpack' ) }>
						<ToggleControl
							label="Show reblog button"
							checked={ reblogSetting }
							onChange={ newValue => {
								setReblogSetting( newValue );
							} }
						/>
					</PanelBody>
				</InspectorControls>
			) }
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
