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

export const ShareButtons: React.FC = () => {
	const prepareUrl = usePrepareUrl();
	return (
		<div className={ styles[ 'share-buttons' ] }>
			{ availableNetworks.map( ( { label, networkName, url } ) => {
				const href = prepareUrl( url );

				return (
					<Button
						key={ networkName }
						icon={ <SocialServiceIcon serviceName={ networkName } /> }
						variant="secondary"
						href={ href }
						target="_blank"
						rel="noopener noreferrer"
						onClick={ onClick }
						data-network={ networkName }
					>
						{ label }
					</Button>
				);
			} ) }
		</div>
	);
};
