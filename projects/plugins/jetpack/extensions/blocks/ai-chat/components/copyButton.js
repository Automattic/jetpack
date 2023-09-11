import { Button, Icon } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function CopyButton( { answer } ) {
	const [ hasCopied, setHasCopied ] = useState( false );
	const copyRef = useCopyToClipboard( answer, () => {
		setHasCopied( true );
		setTimeout( () => setHasCopied( false ), 3000 );
	} );

	return (
		<>
			<Button
				className="copy-button"
				disabled={ hasCopied }
				label={ __( 'Copy Response', 'jetpack' ) }
				ref={ copyRef }
			>
				<Icon icon="clipboard" />
			</Button>
			{ hasCopied && __( 'Copied!', 'jetpack' ) }
		</>
	);
}
