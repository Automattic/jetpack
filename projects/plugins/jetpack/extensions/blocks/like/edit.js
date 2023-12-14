import {
	getBlockIconComponent,
	isSimpleSite,
	isAtomicSite,
} from '@automattic/jetpack-shared-extension-utils';
import { BlockIcon, useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { ExternalLink, Placeholder, ToggleControl, PanelBody } from '@wordpress/components';
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

	const learnMoreUrl =
		isAtomicSite() || isSimpleSite()
			? 'https://wordpress.com/support/likes/'
			: 'https://jetpack.com/support/likes/';

	return (
		<div { ...blockProps }>
			<InspectorControls key="like-inspector">
				<div className="wp-block-jetpack-like__learn-more">
					<ExternalLink href={ learnMoreUrl }>{ __( 'Learn more', 'jetpack' ) }</ExternalLink>
				</div>
				{ isSimpleSite() && (
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
				) }
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
