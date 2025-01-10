import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { SOURCE_JETPACK_AI_GENERAL_PURPOSE_IMAGE_FOR_BLOCK } from '../constants';

function MediaAiButton( props ) {
	const { setSelectedSource, hasLargeButtons } = props;

	return (
		<Button
			__next40pxDefaultSize={ hasLargeButtons }
			variant="secondary"
			className="jetpack-external-media-button-menu"
			aria-haspopup="false"
			onClick={ () => {
				setSelectedSource( SOURCE_JETPACK_AI_GENERAL_PURPOSE_IMAGE_FOR_BLOCK );
			} }
		>
			<div className="jetpack-external-media-button-menu__label">
				{ __( 'Generate with AI', 'jetpack' ) }
			</div>
		</Button>
	);
}

export default MediaAiButton;
