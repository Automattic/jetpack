/**
 * External dependencies
 */
import { Button, Tooltip } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { copySmall, check } from '@wordpress/icons';

type CopyClipboardButtonProps = {
	text: string;
};

/**
 * Renders the copy clipboard button
 *
 * @param {CopyClipboardButtonProps} props - The component props.
 * @return {JSX.Element} The copy clipboard button component.
 */
export default function CopyClipboardButton( { text }: CopyClipboardButtonProps ): JSX.Element {
	const [ showCopyConfirmation, setShowCopyConfirmation ] = useState( false );
	const timeoutIdRef = useRef< number | null >( null );
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

	const copied = __( 'Copied!', 'jetpack-forms' );
	const copy = __( 'Copy', 'jetpack-forms' );
	const emailCopyLabel = showCopyConfirmation ? copied : copy;

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
}
