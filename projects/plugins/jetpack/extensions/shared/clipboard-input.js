import { Button, CheckmarkIcon, ClipboardIcon } from '@automattic/jetpack-components';
import { TextControl } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import './clipboard-input.scss';

const ClipboardInput = ( { link } ) => {
	const [ hasCopied, setHasCopied ] = useState( false );
	const copyTimer = useRef();

	const copyRef = useCopyToClipboard( link, () => {
		if ( copyTimer.current ) {
			clearTimeout( copyTimer.current );
		}
		setHasCopied( true );
		copyTimer.current = setTimeout( () => {
			setHasCopied( false );
			copyTimer.current = undefined;
		}, 3000 );
	} );

	useEffect(
		() => () => {
			if ( copyTimer.current ) {
				clearTimeout( copyTimer.current );
			}
		},
		[]
	);

	const copyLabel = __( 'Copy', 'jetpack' );

	return (
		<div className="jetpack-clipboard-input">
			<TextControl
				readOnly
				value={ link }
				__nextHasNoMarginBottom={ true }
				__next40pxDefaultSize={ true }
			/>
			<Button
				ref={ copyRef }
				aria-label={ copyLabel }
				icon={ hasCopied ? <CheckmarkIcon /> : <ClipboardIcon /> }
				className="components-clipboard-button"
				variant="secondary"
				weight="regular"
			>
				{ copyLabel }
			</Button>
		</div>
	);
};

export default ClipboardInput;
