/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { copySmall, check } from '@wordpress/icons';
import { Tooltip } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import useCopyConfirmation from '../../../hooks/use-copy-confirmation';
import type { JSX } from 'react';
import './style.scss';

type CopyClipboardButtonProps = {
	text: string;
	copyMessage?: string;
	copiedMessage?: string;
};

/**
 * Renders the copy clipboard button
 *
 * @param {CopyClipboardButtonProps} props - The component props.
 * @return {JSX.Element} The copy clipboard button component.
 */
export default function CopyClipboardButton( {
	text,
	copyMessage,
	copiedMessage,
}: CopyClipboardButtonProps ): JSX.Element {
	const { ref, copied: showCopyConfirmation } = useCopyConfirmation( text );

	const copied = copiedMessage || __( 'Copied!', 'jetpack-forms' );
	const copy = copyMessage || __( 'Copy', 'jetpack-forms' );
	const label = showCopyConfirmation ? copied : copy;

	return (
		<Tooltip.Root>
			{ /* Stays open on click so the label can flip to "Copied!" under the pointer. */ }
			<Tooltip.Trigger
				delay={ 0 }
				closeOnClick={ false }
				render={
					<Button
						className="jp-forms__copy-clipboard-button"
						size="small"
						aria-label={ label }
						ref={ ref }
						icon={ showCopyConfirmation ? check : copySmall }
						showTooltip={ false }
					/>
				}
			/>
			<Tooltip.Popup>{ label }</Tooltip.Popup>
		</Tooltip.Root>
	);
}
