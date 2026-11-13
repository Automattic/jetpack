import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check, copy, error, Icon } from '@wordpress/icons';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import Button from 'components/button';

import './style.scss';

const FEEDBACK_TIMEOUT = 2000;

const RESULT_ICON = { idle: copy, copied: check, error };

const noop = () => {};

/**
 * Copy button that shows a temporary check or error icon and announces the outcome.
 *
 * @param {object}   props           - Component props.
 * @param {string}   props.text      - Text to copy.
 * @param {Function} props.onCopy    - Called after a successful copy.
 * @param {string}   props.className - Extra class name.
 * @param {boolean}  props.rna       - Use the RNA button style.
 * @param {*}        props.children  - Button label; it stays the same while feedback shows.
 * @return {object} Button element.
 */
export default function ClipboardButton( {
	text,
	onCopy = noop,
	className,
	rna = false,
	children,
	...buttonProps
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
		text,
		() => {
			setFeedback( { result: 'copied' } );
			speak( __( 'Copied to clipboard', 'jetpack' ) );
			onCopy();
		},
		() => {
			setFeedback( { result: 'error' } );
			speak( __( "Couldn't copy to clipboard.", 'jetpack' ) );
		}
	);

	// The legacy Button hands out a component instance; the hook needs its DOM node.
	const buttonRef = useCallback( instance => copyRef( instance?.domNode ?? null ), [ copyRef ] );

	return (
		<Button
			{ ...buttonProps }
			rna={ rna }
			ref={ buttonRef }
			className={ clsx( 'dops-clipboard-button', className ) }
		>
			<Icon icon={ RESULT_ICON[ feedback.result ] } size={ 16 } />
			{ children }
		</Button>
	);
}

ClipboardButton.propTypes = {
	className: PropTypes.string,
	text: PropTypes.string,
	onCopy: PropTypes.func,
	rna: PropTypes.bool,
	children: PropTypes.node,
};
