/**
 * WordPress dependencies
 */
import { disableDashboard } from '@jetpack-premium-analytics/data';
import { Button, Dialog, Notice, Stack } from '@jetpack-premium-analytics/externals';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';
import { returnToClassicStats } from './return-to-classic-stats';

type SwitchOffDialogProps = {
	open: boolean;
	onClose: () => void;
};

/**
 * Confirms switching the new Traffic tab off. On confirmation it writes the opt-in off
 * and sends the reader to classic Stats, where the invitation to come back lives.
 *
 * @param {SwitchOffDialogProps} props         - Component props.
 * @param {boolean}              props.open    - Whether the dialog is open.
 * @param {Function}             props.onClose - Called once the reader dismisses the dialog.
 * @return The dialog.
 */
export function SwitchOffDialog( { open, onClose }: SwitchOffDialogProps ) {
	const trackEvent = useTrackEvent();
	const [ isSwitchingOff, setIsSwitchingOff ] = useState( false );
	const [ hasFailed, setHasFailed ] = useState( false );

	const handleOpenChange = useCallback(
		( nextOpen: boolean ) => {
			if ( ! nextOpen ) {
				setHasFailed( false );
				onClose();
			}
		},
		[ onClose ]
	);

	const switchOff = useCallback( async () => {
		setIsSwitchingOff( true );
		setHasFailed( false );
		// Before the write: the navigation below would cut short a beacon sent after it.
		trackEvent( 'jetpack_premium_analytics_preview_disable' );

		try {
			await disableDashboard();
		} catch {
			setHasFailed( true );
			setIsSwitchingOff( false );
			return;
		}

		returnToClassicStats();
	}, [ trackEvent ] );

	return (
		<Dialog.Root open={ open } onOpenChange={ handleOpenChange }>
			<Dialog.Popup size="small">
				<Dialog.Content>
					<Stack direction="column" gap="md">
						<Dialog.Title>
							{ __( 'Switch off the new Traffic tab?', 'jetpack-premium-analytics-pkg' ) }
						</Dialog.Title>
						<Dialog.Description>
							{ __(
								"You'll go back to your current Stats. You can switch the new Traffic tab on again from the banner there.",
								'jetpack-premium-analytics-pkg'
							) }
						</Dialog.Description>
						{ hasFailed && (
							<Notice.Root intent="error">
								<Notice.Description>
									{ __(
										"We couldn't switch it off. Please try again.",
										'jetpack-premium-analytics-pkg'
									) }
								</Notice.Description>
							</Notice.Root>
						) }
					</Stack>
				</Dialog.Content>
				<Dialog.Footer>
					<Dialog.Action variant="minimal" disabled={ isSwitchingOff }>
						{ __( 'Cancel', 'jetpack-premium-analytics-pkg' ) }
					</Dialog.Action>
					<Button variant="solid" onClick={ switchOff } disabled={ isSwitchingOff }>
						{ isSwitchingOff
							? __( 'Switching it off…', 'jetpack-premium-analytics-pkg' )
							: __( 'Switch it off', 'jetpack-premium-analytics-pkg' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
