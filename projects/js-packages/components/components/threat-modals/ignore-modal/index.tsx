import { THREAT_ACTION_IGNORE, ThreatsContext } from '@automattic/jetpack-scan';
import { Modal } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useCallback, useContext, useMemo, useState } from 'react';
import { Text, Button, getRedirectUrl } from '@automattic/jetpack-components';
import ConnectionModalContent from '../connection-modal';
import styles from '../styles.module.scss';

const ThreatIgnoreModal = ( props: React.ComponentProps< typeof Modal > ) => {
	const { actionToConfirm, setActionToConfirm, actions, referToCodeable, connection } =
		useContext( ThreatsContext );

	const [ isLoading, setIsLoading ] = useState( false );

	const threat = actionToConfirm?.items[ 0 ];

	const onIgnoreClick = useCallback( () => {
		setIsLoading( true );
		actions?.[ THREAT_ACTION_IGNORE ]?.callback( actionToConfirm.items, {
			onActionPerformed: () => {
				setIsLoading( false );
				setActionToConfirm( undefined );
			},
		} );
	}, [ actions, actionToConfirm.items, setActionToConfirm ] );

	const onCancelClick = useCallback( () => {
		setActionToConfirm( undefined );
	}, [ setActionToConfirm ] );

	const children = useMemo( () => {
		const codeableURL = getRedirectUrl( 'jetpack-protect-codeable-referral' );

		if ( ! connection.connected ) {
			return <ConnectionModalContent />;
		}

		return (
			<>
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
						<Button isDestructive onClick={ onIgnoreClick } isLoading={ isLoading }>
							{ __( 'Ignore Threat', 'jetpack-components' ) }
						</Button>
					</div>
				</div>
			</>
		);
	}, [ connection.connected, referToCodeable, onCancelClick, onIgnoreClick, isLoading ] );

	if ( ! threat?.status || [ 'ignored', 'fixed' ].includes( threat.status ) ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Ignore Threat', 'jetpack-components' ) }
			children={ children }
			{ ...props }
		/>
	);
};

export default ThreatIgnoreModal;
