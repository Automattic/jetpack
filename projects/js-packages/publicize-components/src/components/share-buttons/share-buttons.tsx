import { SocialServiceIcon } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import React from 'react';
import { availableNetworks } from './available-networks';
import styles from './styles.module.scss';
import { usePrepareUrl } from './usePrepareUrl';

/**
 * Click handler for the share buttons.
 *
 * @param {string} url - The URL.
 * @param {object} data - The tracking data.
 *
 * @returns {Function} The click handler.
 */
function getOnClick( url: string, data?: unknown ) {
	return function onClick( event: React.MouseEvent< HTMLAnchorElement > ) {
		event.preventDefault();

		// TODO Add tracking here
		// eslint-disable-next-line no-console
		console.log( 'onClick', { data } );

		window.open(
			url,
			'',
			'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600'
		);
	};
}

export type ShareButtonsProps = {
	buttonStyle?: 'icon' | 'text' | 'icon-text';
	buttonVariant?: React.ComponentProps< typeof Button >[ 'variant' ];
};

export const ShareButtons: React.FC< ShareButtonsProps > = ( {
	buttonStyle = 'icon',
	buttonVariant,
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
						onClick={ getOnClick( href ) }
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
