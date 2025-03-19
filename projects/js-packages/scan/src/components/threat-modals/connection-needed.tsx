import { getRedirectUrl, Button, Text } from '@automattic/jetpack-components';
import { __, _n } from '@wordpress/i18n';
import { useContext, useMemo } from 'react';
import {
	ThreatsContext,
	ShieldIcon,
	THREAT_ACTION_FIX,
	THREAT_ACTION_IGNORE,
} from '@automattic/jetpack-scan';
import CancelButton from './cancel-button.js';
import styles from './styles.module.scss';

/**
 * Connection Needed Modal Content
 *
 * @return {JSX.Element} ConnectionModalContent Component.
 */
export default function ConnectionNeededModalContent(): JSX.Element {
	const { actionToConfirm, connection } = useContext( ThreatsContext );

	const { title, description } = useMemo( () => {
		if ( actionToConfirm ) {
			switch ( actionToConfirm.id ) {
				case THREAT_ACTION_FIX:
					return {
						title: _n(
							'Connect Jetpack to auto-fix threat',
							'Connect Jetpack to auto-fix threats',
							actionToConfirm.items.length,
							'jetpack-scan'
						),
						description: __(
							'A user connection provides Jetpack the access necessary to auto-fix threats on your site.',
							'jetpack-scan'
						),
					};
				case THREAT_ACTION_IGNORE:
					return {
						title: __( 'Connect Jetpack to ignore threats', 'jetpack-scan' ),
						description: __(
							'A user connection provides Jetpack the access necessary to ignore threats on your site.',
							'jetpack-scan'
						),
					};
				default:
					break;
			}
		}

		return {
			title: __( 'Connect Jetpack to continue', 'jetpack-scan' ),
			description: __(
				'A user connection is required for Jetpack to perform certain actions.',
				'jetpack-scan'
			),
		};
	}, [ actionToConfirm ] );

	return (
		<>
			<div className={ styles[ 'threat-modal__content' ] }>
				<div className={ styles[ 'threat-modal__section' ] }>
					<Text className={ styles[ 'threat-modal__section__title' ] }>
						<ShieldIcon variant="warning" height={ 24 } />
						{ title }
					</Text>
					<Text>{ description }</Text>
					<div>
						<Button
							href={ getRedirectUrl( 'why-the-wordpress-com-connection-is-important-for-jetpack' ) }
							variant="link"
							weight="regular"
							isExternalLink={ true }
							key="learn-more"
						>
							{ __( 'Learn more about connections', 'jetpack-scan' ) }
						</Button>
					</div>
				</div>
			</div>
			<div className={ styles[ 'threat-modal__footer' ] }>
				<div className={ styles[ 'threat-modal__footer__actions' ] }>
					<CancelButton />
					<Button
						isExternalLink={ true }
						weight="regular"
						isLoading={ connection.connecting }
						onClick={ connection.connect }
						key="connect"
					>
						{ __( 'Connect your account', 'jetpack-scan' ) }
					</Button>
				</div>
			</div>
		</>
	);
}
