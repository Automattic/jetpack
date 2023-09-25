import { CopyToClipboard as CopyToClipboardBtn } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useCallback } from '@wordpress/element';
import styles from './styles.module.scss';
import { ShareButtonProps } from './types';
import { useShareButtonText } from './useShareButtonText';
import type React from 'react';

/**
 * Copy to clipboard button
 * @param {ShareButtonProps} props - Component props
 *
 * @returns {React.JSX.Element} - Rendered component
 */
export function CopyToClipboard( { buttonStyle = 'icon', buttonVariant }: ShareButtonProps ) {
	const prepareText = useShareButtonText();
	const { recordEvent } = useAnalytics();

	const onCopy = useCallback( () => {
		recordEvent( 'jetpack_social_share_button_clicked', { network: 'clipboard' } );
	}, [ recordEvent ] );

	const textToCopy = useCallback(
		() => prepareText( '{{text}}\n{{url}}', false ),
		[ prepareText ]
	);

	return (
		<CopyToClipboardBtn
			buttonStyle={ buttonStyle }
			onCopy={ onCopy }
			textToCopy={ textToCopy }
			className={ styles.clipboard }
			variant={ buttonVariant }
		/>
	);
}
