import { type SessionsStatus } from '@automattic/jetpack-scan';
import { Modal } from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { useCallback } from 'react';
import Button from '../button';
import ToggleControl from '../toggle-control';
import styles from './styles.module.scss';

interface SessionsModalProps {
	sessionsPendingTerminationConfirmation: SessionsStatus[];
	sessionsWithTerminationConfirmation: SessionsStatus[];
	setSessionsWithTerminationConfirmation: ( sessions: SessionsStatus[] ) => void;
	onConfirm: () => void;
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
	sessionsWithTerminationConfirmation,
	setSessionsWithTerminationConfirmation,
	onConfirm,
	onRequestClose,
	isOpen,
}: SessionsModalProps ): JSX.Element | null {
	const onToggleSession = useCallback(
		( session: SessionsStatus ) => () => {
			if ( sessionsWithTerminationConfirmation.some( s => s.token === session.token ) ) {
				setSessionsWithTerminationConfirmation(
					sessionsWithTerminationConfirmation.filter( s => s.token !== session.token )
				);
			} else {
				setSessionsWithTerminationConfirmation( [
					...sessionsWithTerminationConfirmation,
					session,
				] );
			}
		},
		[ sessionsWithTerminationConfirmation, setSessionsWithTerminationConfirmation ]
	);

	const getSessionTitleString = ( session: SessionsStatus ) => {
		return `User ID: ${ session.userId } - Username: ${
			session.userLogin.trim() ? session.userLogin : 'unknown'
		} - IP: ${ session.ip }`;
	};

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			title={ _n(
				'Terminate Session',
				'Terminate Sessions',
				sessionsWithTerminationConfirmation.length,
				'jetpack-components'
			) }
			focusOnMount={ false }
			onRequestClose={ onRequestClose }
			open={ true }
		>
			<div className={ styles[ 'sessions-modal__content' ] }>
				<div className={ styles[ 'sessions-modal__section' ] }>
					{ sessionsPendingTerminationConfirmation.length > 1 ? (
						<div className={ styles.sessions__toggles }>
							{ sessionsPendingTerminationConfirmation
								.slice()
								.sort( ( a, b ) => a.userId - b.userId )
								.map( session => (
									<div key={ session.token } className={ styles.sessions__toggle }>
										<ToggleControl
											label={ getSessionTitleString( session ) }
											help={ `${ session.token }` }
											checked={ sessionsWithTerminationConfirmation.includes( session ) }
											onChange={ onToggleSession( session ) }
											size="small"
										/>
									</div>
								) ) }
						</div>
					) : (
						<div>
							<div className={ styles[ 'sessions-modal__section__title' ] }>
								{ getSessionTitleString( sessionsPendingTerminationConfirmation[ 0 ] ) }
							</div>
							<p className={ styles[ 'sessions-modal__section__description' ] }>
								{ `${ sessionsPendingTerminationConfirmation[ 0 ].token }` }
							</p>
						</div>
					) }
				</div>
			</div>
			<div className={ styles[ 'sessions-modal__footer' ] }>
				<div className={ styles[ 'sessions-modal__footer__actions' ] }>
					<Button variant="tertiary" onClick={ onRequestClose }>
						{ __( 'Cancel', 'jetpack-components' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ onConfirm }
						isDestructive
						disabled={ ! sessionsWithTerminationConfirmation.length }
					>
						{ sessionsWithTerminationConfirmation.length === 1
							? __( 'Terminate Session', 'jetpack-components' )
							: sprintf(
									/* translators: placeholder is the number of sessions to terminate */
									_n(
										'Terminate %s Sessions', // This will be used for 0 and 2+
										'Terminate %s Sessions', // Same plural form
										sessionsWithTerminationConfirmation.length,
										'jetpack-components'
									),
									sessionsWithTerminationConfirmation.length
							  ) }
					</Button>
				</div>
			</div>
		</Modal>
	);
}
