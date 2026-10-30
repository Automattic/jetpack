import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';

type Props = {
	text: string;
	/** Accessible name naming what is copied, since every button reads "Copy". */
	label?: string;
};

const CopyButton = ( { text, label }: Props ) => {
	const [ copied, setCopied ] = useState( false );
	const onClick = useCallback( async () => {
		try {
			await navigator.clipboard.writeText( text );
		} catch {
			// The clipboard API is unavailable on insecure origins; the value stays selectable.
			return;
		}
		setCopied( true );
		setTimeout( () => setCopied( false ), 2000 );
	}, [ text ] );

	return (
		<Button
			className="jetpack-send-copy"
			variant="outline"
			size="compact"
			onClick={ onClick }
			aria-label={ copied ? undefined : label }
		>
			{ copied ? __( 'Copied', 'jetpack-send-pkg' ) : __( 'Copy', 'jetpack-send-pkg' ) }
		</Button>
	);
};

export default CopyButton;
