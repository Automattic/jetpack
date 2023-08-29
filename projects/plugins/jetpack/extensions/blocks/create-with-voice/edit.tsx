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
			label="AI: Create with voice"
			instructions={ __(
				'Transform your spoken words into publish-ready blocks with AI',
				'jetpack'
			) }
		>
			<Button
				className="jetpack-ai-create-with-voice__record-button"
				icon={ micIcon }
				variant="primary"
				onClick={ startToRecord }
			>
				{ __( 'Start recording', 'jetpack' ) }
			</Button>
		</Placeholder>
	);
}
