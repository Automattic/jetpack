/**
 * External dependencies
 */
import './copy-code-row.scss';
import { ClipboardIconButton } from '@automattic/jetpack-components';
import { useInstanceId } from '@wordpress/compose';
import { useRef, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { JSX } from 'react';

type CopyCodeRowProps = {
	text: string;
	label: string;
	help?: string;
};

/**
 * A row displaying a code snippet with a copy button.
 *
 * @param {CopyCodeRowProps} props - The component props.
 * @return {JSX.Element} The copy code row component.
 */
export const CopyCodeRow = ( { text, label, help }: CopyCodeRowProps ) => {
	const textRef = useRef< HTMLSpanElement >( null );
	const instanceId = useInstanceId( CopyCodeRow );
	const labelId = `jetpack-form-embed-code__label-${ instanceId }`;
	const helpId = `jetpack-form-embed-code__help-${ instanceId }`;

	const handleTextClick = useCallback( () => {
		if ( ! textRef.current ) {
			return;
		}
		const selection = textRef.current.ownerDocument.defaultView?.getSelection();
		if ( selection ) {
			const range = textRef.current.ownerDocument.createRange();
			range.selectNodeContents( textRef.current );
			selection.removeAllRanges();
			selection.addRange( range );
		}
	}, [] );

	const handleKeyDown = useCallback(
		( event: React.KeyboardEvent ) => {
			if ( event.key === 'Enter' || event.key === ' ' ) {
				event.preventDefault();
				event.stopPropagation();
				handleTextClick();
			}
		},
		[ handleTextClick ]
	);

	return (
		<div className="jetpack-form-embed-code__row">
			<span id={ labelId } className="jetpack-form-embed-code__label">
				{ label }
			</span>
			<div className="jetpack-form-embed-code__container">
				<span
					ref={ textRef }
					className="jetpack-form-embed-code__text"
					onClick={ handleTextClick }
					role="textbox"
					aria-readonly="true"
					aria-labelledby={ labelId }
					aria-describedby={ help ? helpId : undefined }
					tabIndex={ 0 }
					onKeyDown={ handleKeyDown }
				>
					{ text }
				</span>
				<ClipboardIconButton
					text={ text }
					label={ sprintf(
						/* translators: %s: label for the code row (e.g. "Embed code", "Shortcode") */
						__( 'Copy %s', 'jetpack-forms' ),
						label.toLowerCase()
					) }
				/>
			</div>
			{ help && (
				<p id={ helpId } className="jetpack-form-embed-code__help">
					{ help }
				</p>
			) }
		</div>
	);
};
