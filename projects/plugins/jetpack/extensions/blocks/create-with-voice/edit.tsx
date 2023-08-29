/**
 * External dependencies
 */
import { micIcon } from '@automattic/jetpack-ai-client';
import { Placeholder, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function CreateWithVoiceEdit() {
	const startToRecord = () => {
		console.log( 'recording...' ); // eslint-disable-line no-console
	};

	return (
		<Placeholder
			icon="microphone"
			label="Create with voice"
			instructions={ __( 'Transform your recording to post content', 'jetpack' ) }
		>
			<Button
				className="jetpack-ai-create-with-voice__record-button"
				icon={ micIcon }
				variant="secondary"
				onClick={ startToRecord }
			>
				{ __( 'Start recording', 'jetpack' ) }
			</Button>
		</Placeholder>
	);
}
