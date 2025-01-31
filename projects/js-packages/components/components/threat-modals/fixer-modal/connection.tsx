import { ThreatsContext } from '@automattic/jetpack-scan';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n } from '@wordpress/i18n';
import { useContext } from 'react';
import getRedirectUrl from '../../../tools/jp-redirect';
import Button from '../../button';
import ShieldIcon from '../../shield-icon';
import Text from '../../text';
import CancelButton from '../cancel-button';
import styles from '../styles.module.scss';

/**
 * Credentials Needed Content
 *
 * @return {JSX.Element} CredentialsNeededContent Component.
 */
export default function ConnectionNeededContent() {
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
						{ createInterpolateElement(
							__(
								'A user connection provides Jetpack the access necessary to auto-fix threats on your site. <link>Learn more about connections</link>.',
								'jetpack-components'
							),
							{
								link: (
									<Button
										href={ getRedirectUrl(
											'why-the-wordpress-com-connection-is-important-for-jetpack'
										) }
										variant="link"
										weight="regular"
										isExternalLink={ true }
										key="learn-more"
									/>
								),
							}
						) }
					</Text>
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
