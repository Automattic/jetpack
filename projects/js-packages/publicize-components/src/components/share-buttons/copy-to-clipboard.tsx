import { CopyToClipboard as CopyToClipboardBtn } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import React, { useCallback } from 'react';
import styles from './styles.module.scss';
import { ShareButtonProps } from './types';
import { usePrepareUrl } from './usePrepareUrl';

export const CopyToClipboard: React.FC< ShareButtonProps > = ( {
	buttonStyle = 'icon',
	buttonVariant,
} ) => {
	const prepareUrl = usePrepareUrl();
	const { recordEvent } = useAnalytics();

	const onCopy = useCallback( () => {
		recordEvent( 'jetpack_social_share_button_clicked', { network: 'clipboard' } );
	}, [ recordEvent ] );

	const textToCopy = useCallback( () => prepareUrl( '{{text}}\n{{url}}', false ), [ prepareUrl ] );

	return (
		<CopyToClipboardBtn
			buttonStyle={ buttonStyle }
			onCopy={ onCopy }
			textToCopy={ textToCopy }
			className={ styles.clipboard }
			variant={ buttonVariant }
		/>
	);
};
