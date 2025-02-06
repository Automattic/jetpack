import { IconTooltip, Text } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import { Icon, check } from '@wordpress/icons';
import clsx from 'clsx';
import React from 'react';
import styles from './styles.module.scss';

/**
 *
 * Share status label component.
 *
 * @param {object}  props         - component props
 * @param {boolean} props.status  - status of the share
 * @param {string}  props.message - link to the share, or error message if failed
 * @return {import('react').ReactNode} - React element
 */
export function ShareStatusLabel( { status, message } ) {
	const isSuccessful = 'success' === status;

	const icon = isSuccessful ? (
		<Icon className={ styles[ 'share-status-icon' ] } icon={ check } />
	) : (
		<IconTooltip
			shift={ true }
			inline={ false }
			title={ __( 'Sharing failed with the following message:', 'jetpack-publicize-components' ) }
			className={ styles[ 'share-status-icon-tooltip' ] }
		>
			<Text variant="body-small" className={ styles[ 'tooltip-text' ] }>
				{ message }
			</Text>
		</IconTooltip>
	);

	return (
		<div
			className={ clsx( styles[ 'share-status-wrapper' ], {
				[ styles[ 'share-status-success' ] ]: isSuccessful,
				[ styles[ 'share-status-failure' ] ]: ! isSuccessful,
			} ) }
		>
			<div className={ styles[ 'share-status-icon' ] }>{ icon }</div>
			<div className={ styles[ 'share-status-label' ] }>
				{ isSuccessful
					? _x( 'Shared', 'The sharing is successful', 'jetpack-publicize-components' )
					: __( 'Failed', 'jetpack-publicize-components' ) }
			</div>
		</div>
	);
}
