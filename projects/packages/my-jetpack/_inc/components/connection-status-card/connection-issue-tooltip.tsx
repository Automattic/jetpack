import { __ } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { Icon, Popover, Stack, Text } from '@wordpress/ui';
import { useCallback, useState } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import styles from './styles.module.scss';

interface AccountError {
	type: string;
	message: string;
	details?: Record< string, unknown >;
}

/**
 * Tooltip that displays possible account errors for the current user.
 *
 * Built on `@wordpress/ui` so it nests above the header's connection popover instead of under it.
 *
 * @return The tooltip component
 */
export function ConnectionIssueTooltip() {
	const { userConnectionData } = useMyJetpackConnection();
	const { recordEvent } = useAnalytics();
	const [ isOpen, setIsOpen ] = useState( false );
	const errors = userConnectionData.currentUser?.possibleAccountErrors ?? {};
	const errorTypes = Object.keys( errors ).join( ',' );

	const onOpenChange = useCallback(
		( open: boolean ) => {
			setIsOpen( open );
			if ( open ) {
				recordEvent( 'jetpack_my_jetpack_account_error_tooltip_open', {
					page: 'my-jetpack',
					location: 'connection_status_card',
					context: 'non_owner',
					error_types: errorTypes,
				} );
			}
		},
		[ recordEvent, errorTypes ]
	);

	if ( ! errorTypes ) {
		return null;
	}

	return (
		<Popover.Root open={ isOpen } onOpenChange={ onOpenChange }>
			<Popover.Trigger
				className={ styles[ 'account-error-trigger' ] }
				aria-label={ __( 'Possible account issue', 'jetpack-my-jetpack' ) }
			>
				<Icon icon={ info } size={ 16 } />
			</Popover.Trigger>
			<Popover.Popup
				className={ styles[ 'account-error-popup' ] }
				positioner={ <Popover.Positioner collisionPadding={ 16 } /> }
			>
				<Stack direction="column" gap="sm">
					<Text variant="heading-sm" render={ <Popover.Title /> }>
						{ __( 'Possible account issue', 'jetpack-my-jetpack' ) }
					</Text>
					{ Object.values( errors ).map( ( error: AccountError, index ) => (
						<Text key={ `error-${ index }` } variant="body-md">
							{ error.message ||
								__(
									'We noticed a possible issue with your account connection that might lead to connection issues.',
									'jetpack-my-jetpack'
								) }
						</Text>
					) ) }
				</Stack>
			</Popover.Popup>
		</Popover.Root>
	);
}
