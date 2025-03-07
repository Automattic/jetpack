import { type SessionsStatus } from '@automattic/jetpack-scan';
import { Modal } from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from 'react';
import Button from '../button';
import ToggleControl from '../toggle-control';
import styles from './styles.module.scss';

interface SessionsModalProps {
	sessionsPendingTerminationConfirmation: SessionsStatus[];
	onConfirm: ( sessionWithTerminationConfirmation: SessionsStatus[] ) => void;
	onRequestClose: () => void;
	isOpen: boolean;
}

/**
 * Sessions Modal Content
 *
 * @param {SessionsModalProps} props - Component props.
 *
 * @return {JSX.Element | null} SessionsModal Component.
 */
export default function SessionsModal( {
	sessionsPendingTerminationConfirmation,
	onConfirm,
	onRequestClose,
	isOpen,
}: SessionsModalProps ): JSX.Element | null {
	const [ sessionWithTerminationConfirmation, setSessionWithTerminationConfirmation ] = useState<
		SessionsStatus[]
	>( [] );

	useEffect( () => {
		setSessionWithTerminationConfirmation( sessionsPendingTerminationConfirmation );
	}, [ sessionsPendingTerminationConfirmation ] );

	const onToggleSession = useCallback(
		( session: SessionsStatus ) => () => {
			if ( sessionWithTerminationConfirmation.some( s => s.token === session.token ) ) {
				setSessionWithTerminationConfirmation(
					sessionWithTerminationConfirmation.filter( s => s.token !== session.token )
				);
			} else {
				setSessionWithTerminationConfirmation( [ ...sessionWithTerminationConfirmation, session ] );
			}
		},
		[ sessionWithTerminationConfirmation, setSessionWithTerminationConfirmation ]
	);

	const onConfirmClick = useCallback( () => {
		onConfirm( sessionWithTerminationConfirmation );
	}, [ sessionWithTerminationConfirmation, onConfirm ] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			title={ _n(
				'Terminate Session',
				'Terminate Sessions',
				sessionWithTerminationConfirmation.length,
				'jetpack-components'
			) }
			focusOnMount={ false }
			onRequestClose={ onRequestClose }
			open={ true }
		>
			<div className={ styles[ 'sessions-modal__content' ] }>
				<div className={ styles[ 'sessions-modal__section' ] }>
					<div className={ styles.sessions__toggles }>
						{ sessionsPendingTerminationConfirmation.map( session => (
							<div key={ session.token } className={ styles.sessions__toggle }>
								<ToggleControl
									label={ __( 'Title', 'jetpack-components' ) }
									help={ __( 'Description', 'jetpack-components' ) }
									checked={ sessionWithTerminationConfirmation.includes( session ) }
									onChange={ onToggleSession( session ) }
									size="small"
								/>
							</div>
						) ) }
					</div>
				</div>
			</div>
			<div className={ styles[ 'sessions-modal__footer' ] }>
				<div className={ styles[ 'sessions-modal__footer__actions' ] }>
					<Button variant="tertiary" onClick={ onRequestClose }>
						{ __( 'Cancel', 'jetpack-components' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ onConfirmClick }
						isDestructive
						disabled={ ! sessionWithTerminationConfirmation.length }
					>
						{ sprintf(
							/* translators: placeholder is the number of sessions to terminate */
							_n(
								'Terminate %s Session',
								'Terminate %s Sessions',
								sessionWithTerminationConfirmation.length,
								'jetpack-components'
							),
							sessionWithTerminationConfirmation.length
						) }
					</Button>
				</div>
			</div>
		</Modal>
	);
}
