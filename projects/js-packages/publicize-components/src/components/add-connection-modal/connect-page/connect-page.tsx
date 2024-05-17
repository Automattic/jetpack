import { Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { useCallback } from 'react';
import { store as socialStore } from '../../../social-store';
import { ConnectForm } from '../connect-form';
import styles from './style.module.scss';
import type { SupportedService } from '../use-supported-services';

type ConnectPageProps = {
	service: SupportedService;
	onBackClicked: VoidFunction;
	onConfirm: ( data: unknown ) => void;
};

export const ConnectPage: React.FC< ConnectPageProps > = ( {
	service,
	onBackClicked,
	onConfirm,
} ) => {
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const connections = useSelect( select => {
		return select( socialStore ).getConnections();
	}, [] );

	const isMastodonAlreadyConnected = useCallback(
		( username: string ) => {
			return connections.some( connection => {
				return connection.service_name === 'mastodon' && connection.external_display === username;
			} );
		},
		[ connections ]
	);

	return (
		<>
			<div
				className={ classNames( styles[ 'example-wrapper' ], {
					[ styles.small ]: isSmall,
				} ) }
			>
				{ service.examples.map( ( Example, idx ) => (
					<div key={ service.ID + idx } className={ styles.example }>
						<Example />
					</div>
				) ) }
			</div>
			<div className={ styles[ 'actions-wrapper' ] }>
				<Button
					variant="secondary"
					onClick={ onBackClicked }
					aria-label={ __( 'Go back', 'jetpack' ) }
				>
					{ __( 'Back', 'jetpack' ) }
				</Button>
				<ConnectForm
					service={ service }
					isSmall={ isSmall }
					onConfirm={ onConfirm }
					displayInputs
					isMastodonAlreadyConnected={ isMastodonAlreadyConnected }
				/>
			</div>
		</>
	);
};
