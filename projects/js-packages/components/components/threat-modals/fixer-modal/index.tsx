import { ThreatsContext } from '@automattic/jetpack-scan';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useContext } from 'react';
import Button from '../../button';
import Text from '../../text';
import useFixer from '../../threat-fixers/use-fixer';
import styles from '../styles.module.scss';

/**
 * Threat Fixer Modal Content
 *
 * @param {object} props - Component props.
 *
 * @return {JSX.Element} ThreatFixerModalContent Component.
 */
export default function ThreatFixerModal( props ) {
	const { actionToConfirm, setActionToConfirm } = useContext( ThreatsContext );

	// const threats = actionToConfirm?.items || []; // to do
	const threat = actionToConfirm?.items[ 0 ];

	const { title, description, actions, icon } = useFixer( { threat } );

	const onCancelClick = useCallback( () => {
		setActionToConfirm( undefined );
	}, [ setActionToConfirm ] );

	return (
		<Modal
			title={ __( 'Auto-Fix Threat', 'jetpack-components' ) }
			focusOnMount={ false }
			{ ...props }
		>
			<div className={ styles[ 'threat-modal__content' ] }>
				<div className={ styles[ 'threat-modal__section' ] }>
					<Text className={ styles[ 'threat-modal__section__title' ] }>
						{ icon }
						{ title }
					</Text>
					<Text>{ description }</Text>
				</div>
			</div>
			<div className={ styles[ 'threat-modal__footer' ] }>
				<div className={ styles[ 'threat-modal__footer__actions' ] }>
					<Button variant="tertiary" onClick={ onCancelClick }>
						{ __( 'Cancel', 'jetpack-components' ) }
					</Button>
					{ actions }
				</div>
			</div>
		</Modal>
	);
}
