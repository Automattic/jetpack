import { __ } from '@wordpress/i18n';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { InfoPopover } from '../info-popover';

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
	const errors = userConnectionData.currentUser?.possibleAccountErrors ?? {};
	const errorTypes = Object.keys( errors );

	if ( ! errorTypes.length ) {
		return null;
	}

	const title = __( 'Possible account issue', 'jetpack-my-jetpack' );

	return (
		<span style={ { display: 'inline-flex', verticalAlign: 'middle' } }>
			<InfoPopover
				label={ title }
				triggerLabel={ title }
				title={ title }
				text={ ( Object.values( errors ) as AccountError[] )
					.map(
						error =>
							error.message ||
							__(
								'We noticed a possible issue with your account connection that might lead to connection issues.',
								'jetpack-my-jetpack'
							)
					)
					.join( ' ' ) }
				tracksEventName="my_jetpack_account_error_tooltip_open"
				tracksEventProps={ {
					location: 'connection_status_card',
					context: 'non_owner',
					error_types: errorTypes.join( ',' ),
				} }
				warning
			/>
		</span>
	);
}
