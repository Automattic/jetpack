import { ThreatsContext } from '@automattic/jetpack-scan';
import { __, _n } from '@wordpress/i18n';
import { useContext } from 'react';
import getRedirectUrl from '../../../tools/jp-redirect/index.js';
import Button from '../../button/index.js';
import ShieldIcon from '../../shield-icon/index.js';
import Text from '../../text/index.js';
import CancelButton from '../cancel-button.js';
import styles from '../styles.module.scss';

/**
 * Connection Needed Modal Content
 *
 * @return {JSX.Element} ConnectionModalContent Component.
 */
export default function ConnectionModalContent(): JSX.Element {
	const { actionToConfirm, connection } = useContext( ThreatsContext );

	return (
		<>
			<div className={ styles[ 'threat-modal__content' ] }>
				<div className={ styles[ 'threat-modal__section' ] }>
					<Text className={ styles[ 'threat-modal__section__title' ] }>
						<ShieldIcon variant="warning" height={ 24 } />
						{ _n(
							'User connection needed to auto-fix threat',
							'User connection needed to auto-fix threats',
							actionToConfirm.items.length,
							'jetpack-components'
						) }
					</Text>
					<Text>
						{ __(
							'A user connection provides Jetpack the access necessary to auto-fix threats on your site.',
							'jetpack-components'
						) }
					</Text>
					<div>
						<Button
							href={ getRedirectUrl( 'why-the-wordpress-com-connection-is-important-for-jetpack' ) }
							variant="link"
							weight="regular"
							isExternalLink={ true }
							key="learn-more"
						>
							{ __( 'Learn more about connections', 'jetpack-components' ) }
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
						{ __( 'Connect your account', 'jetpack-components' ) }
					</Button>
				</div>
			</div>
		</>
	);
}
