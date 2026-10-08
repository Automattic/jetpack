import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';

const CopyButton = ( { text }: { text: string } ) => {
	const [ copied, setCopied ] = useState( false );
	const onClick = useCallback( async () => {
		await navigator.clipboard.writeText( text );
		setCopied( true );
		setTimeout( () => setCopied( false ), 2000 );
	}, [ text ] );

	return (
		<Button variant="outline" size="compact" onClick={ onClick }>
			{ copied ? __( 'Copied', 'jetpack-send-pkg' ) : __( 'Copy', 'jetpack-send-pkg' ) }
		</Button>
	);
};

export default CopyButton;
