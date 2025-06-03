/**
 * External dependencies
 */
import { Button, Tooltip } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { copySmall, check } from '@wordpress/icons';

const CopyClipboardButton = ( { text } ) => {
	const [ showCopyConfirmation, setShowCopyConfirmation ] = useState( false );
	const timeoutIdRef = useRef();
	const ref = useCopyToClipboard( text, () => {
		setShowCopyConfirmation( true );
		if ( timeoutIdRef.current ) {
			clearTimeout( timeoutIdRef.current );
		}
		timeoutIdRef.current = setTimeout( () => {
			setShowCopyConfirmation( false );
		}, 4000 );
	} );

	useEffect( () => {
		return () => {
			if ( timeoutIdRef.current ) {
				clearTimeout( timeoutIdRef.current );
			}
		};
	}, [] );

	const emailCopyLabel = showCopyConfirmation
		? __( 'Copied!', 'jetpack-forms' )
		: __( 'Copy', 'jetpack-forms' );

	return (
		<Tooltip delay={ 0 } hideOnClick={ false } text={ emailCopyLabel }>
			<Button
				size="small"
				aria-label={ emailCopyLabel }
				ref={ ref }
				icon={ showCopyConfirmation ? check : copySmall }
				showTooltip={ false }
			/>
		</Tooltip>
	);
};

export default CopyClipboardButton;
