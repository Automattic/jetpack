import { SocialServiceIcon, Button } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useCallback } from '@wordpress/element';
import { availableNetworks } from './available-networks';
import { CopyToClipboard } from './copy-to-clipboard';
import styles from './styles.module.scss';
import { ShareButtonProps } from './types';
import { useShareButtonText } from './useShareButtonText';
import type React from 'react';

export type ShareButtonsProps = ShareButtonProps;

/**
 * Renders share buttons
 *
 * @param {ShareButtonsProps} props - Component props
 *
 * @returns {React.JSX.Element} - Rendered component
 */
export function ShareButtons( { buttonStyle = 'icon', buttonVariant }: ShareButtonsProps ) {
	const prepareUrl = useShareButtonText();

	const { recordEvent } = useAnalytics();

	const getOnClick = useCallback(
		function ( url: string, data?: unknown ) {
			return function onClick( event: React.MouseEvent< HTMLAnchorElement > ) {
				event.preventDefault();

				recordEvent( 'jetpack_social_share_button_clicked', data );

				window.open(
					url,
					'',
					'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600'
				);
			};
		},
		[ recordEvent ]
	);

	return (
		<div className={ styles[ 'share-buttons' ] }>
			{ availableNetworks.map( ( { label, networkName, url } ) => {
				const href = prepareUrl( url );

				const icon =
					'text' !== buttonStyle ? <SocialServiceIcon serviceName={ networkName } /> : null;

				return (
					<Button
						key={ networkName }
						icon={ icon }
						variant={ buttonVariant }
						aria-label={ label }
						href={ href }
						target="_blank"
						rel="noopener noreferrer"
						onClick={ getOnClick( href, { network: networkName } ) }
						data-network={ networkName }
						className={ styles[ networkName ] }
					>
						{ 'icon' !== buttonStyle ? label : null }
					</Button>
				);
			} ) }
			<CopyToClipboard buttonStyle={ buttonStyle } buttonVariant={ buttonVariant } />
		</div>
	);
}
