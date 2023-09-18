import { SocialServiceIcon } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import React from 'react';
import { availableNetworks } from './available-networks';
import styles from './styles.module.scss';
import { usePrepareUrl } from './usePrepareUrl';

/**
 * Click handler for the share buttons.
 *
 * @param {React.MouseEvent< HTMLAnchorElement >} event - The click event.
 */
function onClick( event: React.MouseEvent< HTMLAnchorElement > ) {
	// TODO Add tracking here
	if ( event.target instanceof HTMLAnchorElement ) {
		const { network } = event.target.dataset;

		network;
	}
}

export type ShareButtonsProps = {
	buttonStyle?: 'icon' | 'text' | 'icon-text';
	buttonVariant?: React.ComponentProps< typeof Button >[ 'variant' ];
};

export const ShareButtons: React.FC< ShareButtonsProps > = ( {
	buttonStyle = 'icon-text',
	buttonVariant = 'secondary',
} ) => {
	const prepareUrl = usePrepareUrl();
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
						onClick={ onClick }
						data-network={ networkName }
					>
						{ 'icon' !== buttonStyle ? label : null }
					</Button>
				);
			} ) }
		</div>
	);
};
