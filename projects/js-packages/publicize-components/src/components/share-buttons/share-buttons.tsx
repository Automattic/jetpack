import { SocialServiceIcon } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import React, { useCallback } from 'react';
import { availableNetworks } from './available-networks';
import styles from './styles.module.scss';
import { usePrepareUrl } from './usePrepareUrl';

export type ShareButtonsProps = {
	buttonStyle?: 'icon' | 'text' | 'icon-text';
	buttonVariant?: React.ComponentProps< typeof Button >[ 'variant' ];
};

export const ShareButtons: React.FC< ShareButtonsProps > = ( {
	buttonStyle = 'icon',
	buttonVariant,
} ) => {
	const prepareUrl = usePrepareUrl();

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
		</div>
	);
};
