import { SocialServiceIcon } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import React from 'react';
import { useCallback } from 'react';
import { availableNetworks } from './available-networks';
import { usePrepareUrl } from './usePrepareUrl';

import './styles.scss';

export const ShareButtons: React.FC = () => {
	const prepareUrl = usePrepareUrl();

	const onClick = useCallback( ( event: React.MouseEvent< HTMLAnchorElement > ) => {
		if ( event.target instanceof HTMLAnchorElement ) {
			const { network } = event.target.dataset;

			// TODO Add tracking here
			network;
		}
	}, [] );

	return (
		<div className="share-buttons">
			<div className="share-buttons__list">
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
		</div>
	);
};
