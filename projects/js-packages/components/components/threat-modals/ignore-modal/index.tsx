import { THREAT_ACTION_IGNORE, ThreatsContext } from '@automattic/jetpack-scan';
import { Modal } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useCallback, useContext } from 'react';
import { Text, Button, getRedirectUrl } from '@automattic/jetpack-components';
import styles from '../styles.module.scss';

const ThreatIgnoreModal = props => {
	const {
		selectedThreat: threat,
		setActionToConfirm,
		actionCallbacks,
		referToCodeable,
	} = useContext( ThreatsContext );

	const onIgnoreClick = useCallback( () => {
		actionCallbacks?.[ THREAT_ACTION_IGNORE ]?.( [ threat ] );
	}, [ threat, actionCallbacks ] );

	const onCancelClick = useCallback( () => {
		setActionToConfirm( undefined );
	}, [ setActionToConfirm ] );

	if ( ! threat?.status || [ 'ignored', 'fixed' ].includes( threat.status ) ) {
		return null;
	}

	const codeableURL = getRedirectUrl( 'jetpack-protect-codeable-referral' );

	return (
		<Modal title={ __( 'Ignore Threat', 'jetpack-components' ) } { ...props }>
			<div className={ styles[ 'threat-modal__content' ] }>
				<Text className={ styles[ 'threat-modal__section__title' ] }>
					{ __( 'Are you sure you want to ignore this threat?', 'jetpack-components' ) }
				</Text>
				<Text>
					{ __(
						'By choosing to ignore this threat, you acknowledge that you have reviewed the detected code. You are accepting the risks of maintaining a potentially malicious or vulnerable file on your site.',
						'jetpack-components'
					) }
				</Text>
				<Text>
					{ referToCodeable &&
						createInterpolateElement(
							__(
								'If you are unsure, please request an estimate with <codeableLink>Codeable</codeableLink>.',
								'jetpack-components'
							),
							{
								codeableLink: (
									<Button
										variant="link"
										isExternalLink={ true }
										href={ codeableURL }
										tabIndex={ -1 }
									/>
								),
							}
						) }
				</Text>
			</div>
			<div className={ styles[ 'threat-modal__footer' ] }>
				<div className={ styles[ 'threat-modal__footer__actions' ] }>
					<Button variant="tertiary" onClick={ onCancelClick }>
						{ __( 'Cancel', 'jetpack-components' ) }
					</Button>
					<Button isDestructive onClick={ onIgnoreClick }>
						{ __( 'Ignore Threat', 'jetpack-components' ) }
					</Button>
				</div>
			</div>
		</Modal>
	);
};

export default ThreatIgnoreModal;
