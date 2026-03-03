/**
 * External dependencies
 */
import './copy-code-row.scss';
import { Button, Popover } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { copySmall, check } from '@wordpress/icons';

type CopyCodeRowProps = {
	text: string;
	label: string;
};

/**
 * A row displaying a code snippet with a copy button.
 *
 * @param {CopyCodeRowProps} props - The component props.
 * @return {JSX.Element} The copy code row component.
 */
export const CopyCodeRow = ( { text, label }: CopyCodeRowProps ) => {
	const [ showCopyConfirmation, setShowCopyConfirmation ] = useState( false );
	const timeoutIdRef = useRef< number | null >( null );
	const textRef = useRef< HTMLSpanElement >( null );

	const handleTextClick = useCallback( () => {
		if ( ! textRef.current ) {
			return;
		}
		const selection = textRef.current.ownerDocument.defaultView?.getSelection();
		if ( selection ) {
			const range = document.createRange();
			range.selectNodeContents( textRef.current );
			selection.removeAllRanges();
			selection.addRange( range );
		}
	}, [] );

	const handleKeyDown = useCallback(
		( event: React.KeyboardEvent ) => {
			if ( event.key === 'Enter' || event.key === ' ' ) {
				handleTextClick();
			}
		},
		[ handleTextClick ]
	);

	const ref = useCopyToClipboard( text, () => {
		setShowCopyConfirmation( true );
		if ( timeoutIdRef.current ) {
			clearTimeout( timeoutIdRef.current );
		}
		timeoutIdRef.current = setTimeout( () => {
			setShowCopyConfirmation( false );
		}, 2000 );
	} );

	useEffect( () => {
		return () => {
			if ( timeoutIdRef.current ) {
				clearTimeout( timeoutIdRef.current );
			}
		};
	}, [] );

	return (
		<div className="jetpack-form-embed-code__row">
			<span className="jetpack-form-embed-code__label">{ label }</span>
			<div className="jetpack-form-embed-code__container">
				<span
					ref={ textRef }
					className="jetpack-form-embed-code__text"
					onClick={ handleTextClick }
					role="textbox"
					tabIndex={ 0 }
					onKeyDown={ handleKeyDown }
				>
					{ text }
				</span>
				{ showCopyConfirmation ? (
					<Button
						ref={ ref }
						icon={ check }
						size="compact"
						label={ __( 'Copied!', 'jetpack-forms' ) }
					>
						<Popover
							placement="top"
							noArrow={ false }
							focusOnMount={ false }
							className="jetpack-form-embed-code__popover"
						>
							{ __( 'Copied!', 'jetpack-forms' ) }
						</Popover>
					</Button>
				) : (
					<Button ref={ ref } icon={ copySmall } size="compact" label={ label } />
				) }
			</div>
		</div>
	);
};
