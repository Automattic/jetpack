import { __ } from '@wordpress/i18n';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { InfoTooltip } from '../info-tooltip';

interface AccountError {
	type: string;
	message: string;
	details?: Record< string, unknown >;
}

/**
 * Tooltip that displays possible account errors for the current user.
 *
 * @return The tooltip component
 */
export function ConnectionIssueTooltip() {
	const { userConnectionData } = useMyJetpackConnection();

	return (
		userConnectionData.currentUser?.possibleAccountErrors &&
		Object.keys( userConnectionData.currentUser.possibleAccountErrors ).length > 0 && (
			<span style={ { display: 'inline-flex', verticalAlign: 'middle' } }>
				<InfoTooltip
					tracksEventName="my_jetpack_account_error_tooltip_open"
					tracksEventProps={ {
						location: 'connection_status_card',
						context: 'non_owner',
						error_types: Object.keys( userConnectionData.currentUser.possibleAccountErrors ).join(
							','
						),
					} }
					iconSize={ 16 }
					className="account-error-tooltip"
				>
					<div>
						{ Object.values( userConnectionData.currentUser.possibleAccountErrors ).map(
							( error: AccountError, index ) => (
								<p key={ `error-${ index }` } style={ { marginBottom: '1em' } }>
									{ error.message ||
										__(
											'We noticed a possible issue with your account connection that might lead to connection issues.',
											'jetpack-my-jetpack'
										) }
								</p>
							)
						) }
					</div>
				</InfoTooltip>
			</span>
		)
	);
}
