/**
 * External dependencies
 */
import './copy-code-row.scss';
import { Button, Popover } from '@wordpress/components';
import { useRef, useCallback } from '@wordpress/element';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { copySmall, check } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import useCopyConfirmation from '../../hooks/use-copy-confirmation';

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
	const textRef = useRef< HTMLSpanElement >( null );
	const { ref, copied: showCopyConfirmation } = useCopyConfirmation( text, 2000 );

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
			<span className="jetpack-form-embed-code__label">{ label }</span>
			<div className="jetpack-form-embed-code__container">
				<span
					ref={ textRef }
					className="jetpack-form-embed-code__text"
					onClick={ handleTextClick }
					role="textbox"
					aria-readonly="true"
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
							placement={ isRTL() ? 'top-start' : 'top-end' }
							noArrow={ false }
							focusOnMount={ false }
							className="jetpack-form-embed-code__popover"
						>
							{ __( 'Copied!', 'jetpack-forms' ) }
						</Popover>
					</Button>
				) : (
					<Button
						ref={ ref }
						icon={ copySmall }
						size="compact"
						label={ sprintf(
							/* translators: %s: label for the code row (e.g. "Embed code", "Shortcode") */
							__( 'Copy %s', 'jetpack-forms' ),
							label.toLowerCase()
						) }
					/>
				) }
			</div>
		</div>
	);
};
