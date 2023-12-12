import { getBlockIconComponent, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { BlockIcon, useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { Placeholder, ToggleControl, PanelBody } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';
import './editor.scss';
import useFetchReblogSetting from './use-fetch-reblog-setting';
import useSetReblogSetting from './use-set-reblog-setting';

const icon = getBlockIconComponent( metadata );

function LikeEdit( { noticeUI } ) {
	const blockProps = useBlockProps();
	const blogId = window?.Jetpack_LikeBlock?.blog_id;

	const {
		fetchReblog,
		reblogSetting: currentReblogSetting,
		isLoading: fetchingReblog,
	} = useFetchReblogSetting( blogId );
	const {
		setReblog,
		success: reblogSetSuccessfully,
		resetSuccess: clearReblogSetStatus,
		isLoading: settingReblog,
	} = useSetReblogSetting( blogId );

	const handleReblogSetting = newValue => {
		setReblog( newValue );
	};

	useEffect( () => {
		if ( ! isSimpleSite() ) {
			return;
		}
		fetchReblog();
	}, [ fetchReblog ] );

	useEffect( () => {
		if ( ! isSimpleSite() ) {
			return;
		}

		if ( reblogSetSuccessfully ) {
			fetchReblog();
			clearReblogSetStatus();
		}
	}, [ reblogSetSuccessfully, fetchReblog, clearReblogSetStatus ] );

	return (
		<div { ...blockProps }>
			{ isSimpleSite() && (
				<InspectorControls>
					<PanelBody title={ __( 'Settings', 'jetpack' ) }>
						<ToggleControl
							label={ __( 'Show reblog button', 'jetpack' ) }
							checked={ currentReblogSetting }
							disabled={ settingReblog || fetchingReblog }
							onChange={ newValue => {
								handleReblogSetting( newValue );
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
