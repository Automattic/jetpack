/**
 * WordPress dependencies
 */
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Copy `text` to the clipboard and surface a short-lived "copied" confirmation.
 *
 * Wraps `useCopyToClipboard` with the confirmation-flag + auto-reset timeout that
 * both the dashboard copy button and the form-editor copy row need.
 *
 * @param text    - The text to copy.
 * @param resetMs - How long the confirmation stays true, in ms. Defaults to 4000.
 * @return `ref` to attach to the trigger element, and the `copied` flag.
 */
export default function useCopyConfirmation( text: string, resetMs = 4000 ) {
	const [ copied, setCopied ] = useState( false );
	const timeoutIdRef = useRef< number | null >( null );

	const ref = useCopyToClipboard( text, () => {
		setCopied( true );
		if ( timeoutIdRef.current !== null ) {
			clearTimeout( timeoutIdRef.current );
		}
		timeoutIdRef.current = setTimeout( () => {
			setCopied( false );
		}, resetMs );
	} );

	useEffect( () => {
		return () => {
			if ( timeoutIdRef.current !== null ) {
				clearTimeout( timeoutIdRef.current );
			}
		};
	}, [] );

	return { ref, copied };
}
