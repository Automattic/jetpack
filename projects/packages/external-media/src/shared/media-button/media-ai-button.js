import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { SOURCE_JETPACK_AI_GENERAL_PURPOSE_IMAGE_FOR_BLOCK } from '../constants';
import { isSupportNext40pxDefaultSize } from '../utils/is-support-next-40px-default-size';

/**
 * MediaAiButton component
 * @param {object} props - The component properties.
 * @return {React.ReactElement} The `MediaAiButton` component.
 */
function MediaAiButton( props ) {
	const { setSelectedSource } = props;

	return (
		<Button
			__next40pxDefaultSize={ isSupportNext40pxDefaultSize() }
			variant="secondary"
			className="jetpack-external-media-button-menu"
			aria-haspopup="false"
			onClick={ () => {
				setSelectedSource( SOURCE_JETPACK_AI_GENERAL_PURPOSE_IMAGE_FOR_BLOCK );
			} }
		>
			<div className="jetpack-external-media-button-menu__label">
				{ __( 'Generate with AI', 'jetpack-external-media' ) }
			</div>
		</Button>
	);
}

export default MediaAiButton;
