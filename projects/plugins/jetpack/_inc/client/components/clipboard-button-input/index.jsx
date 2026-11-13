import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check, copy, error } from '@wordpress/icons';
import { IconButton, InputControl, InputLayout } from '@wordpress/ui';
import clsx from 'clsx';
import PropTypes from 'prop-types';

const FEEDBACK_TIMEOUT = 2000;

const RESULT_ICON = { idle: copy, copied: check, error };

/**
 * Read-only text field with a copy button that shows a check or error icon and announces the result.
 *
 * @param {object}  props                     - Component props.
 * @param {string}  props.label               - Accessible label of the field.
 * @param {string}  props.value               - Text shown in the field and copied.
 * @param {string}  props.className           - Class for the root element; use it only for width and position.
 * @param {string}  props.copyLabel           - Accessible name and tooltip of the copy button.
 * @param {boolean} props.disabled            - Disable the field and the button.
 * @param {boolean} props.hideLabelFromVision - Hide the label visually but keep it for screen readers.
 * @return {object} Field element.
 */
export default function ClipboardButtonInput( {
	label,
	value = '',
	className,
	copyLabel = __( 'Copy', 'jetpack' ),
	disabled = false,
	hideLabelFromVision = false,
	...inputProps
} ) {
	// A fresh object per result restarts the timeout for repeated copies.
	const [ feedback, setFeedback ] = useState( { result: 'idle' } );

	useEffect( () => {
		if ( feedback.result === 'idle' ) {
			return;
		}
		const timeoutId = setTimeout( () => setFeedback( { result: 'idle' } ), FEEDBACK_TIMEOUT );
		return () => clearTimeout( timeoutId );
	}, [ feedback ] );

	const copyRef = useCopyToClipboard(
		value,
		() => {
			setFeedback( { result: 'copied' } );
			speak( __( 'Copied to clipboard', 'jetpack' ) );
		},
		() => {
			setFeedback( { result: 'error' } );
			speak( __( "Couldn't copy to clipboard.", 'jetpack' ) );
		}
	);

	return (
		<div className={ clsx( 'jetpack-components-clipboard-button-input', className ) }>
			<InputControl
				{ ...inputProps }
				label={ label }
				hideLabelFromVision={ hideLabelFromVision }
				value={ value }
				disabled={ disabled }
				readOnly
				// URLs and email addresses read left to right in every locale.
				dir="ltr"
				suffix={
					<InputLayout.Slot padding="minimal">
						<IconButton
							ref={ copyRef }
							label={ copyLabel }
							icon={ RESULT_ICON[ feedback.result ] }
							variant="minimal"
							tone="neutral"
							size="small"
							disabled={ disabled }
						/>
					</InputLayout.Slot>
				}
			/>
		</div>
	);
}

ClipboardButtonInput.propTypes = {
	label: PropTypes.string.isRequired,
	value: PropTypes.string,
	className: PropTypes.string,
	copyLabel: PropTypes.string,
	disabled: PropTypes.bool,
	hideLabelFromVision: PropTypes.bool,
};
