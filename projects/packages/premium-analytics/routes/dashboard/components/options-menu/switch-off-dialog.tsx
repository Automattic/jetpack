/**
 * WordPress dependencies
 */
import {
	disableDashboard,
	getApiErrorCode,
	submitStatsUserFeedback,
	type StatsFeedbackRating,
} from '@jetpack-premium-analytics/data';
import { Button, Dialog, Notice, Stack } from '@jetpack-premium-analytics/externals';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';
import { ComparisonFields } from '../feedback/feedback-fields';
import { returnToClassicStats } from './return-to-classic-stats';

// Reaches Happiness as the subject line, so it tells exit feedback from the in-product kind.
const PRODUCT_NAME = 'Jetpack Stats v2 (switched off)';

type SwitchOffDialogProps = {
	onClose: () => void;
};

/**
 * Confirms switching the new Traffic tab off, and asks why on the way out; nothing is
 * required. On confirmation it writes the opt-in off and sends the reader to classic Stats.
 *
 * @param {SwitchOffDialogProps} props         - Component props.
 * @param {Function}             props.onClose - Called once the reader dismisses the dialog.
 * @return The dialog.
 */
export function SwitchOffDialog( { onClose }: SwitchOffDialogProps ) {
	const trackEvent = useTrackEvent();
	const [ rating, setRating ] = useState< StatsFeedbackRating >();
	const [ comment, setComment ] = useState( '' );
	const [ isSwitchingOff, setIsSwitchingOff ] = useState( false );
	const [ hasFailed, setHasFailed ] = useState( false );
	// A confirmation opens on its way out, not on the first point of a scale nobody has to fill in.
	const cancelRef = useRef< HTMLButtonElement >( null );

	// Escape and the backdrop wait for the write too: a success would otherwise navigate away
	// from wherever the reader went next, and a failure would surface on the next open.
	const handleOpenChange = useCallback(
		( nextOpen: boolean ) => {
			if ( ! nextOpen && ! isSwitchingOff ) {
				onClose();
			}
		},
		[ isSwitchingOff, onClose ]
	);

	const switchOff = useCallback( async () => {
		setIsSwitchingOff( true );
		setHasFailed( false );

		try {
			await disableDashboard();
		} catch ( error ) {
			// eslint-disable-next-line no-console -- the notice names no cause, so the code goes where a report can find it
			console.error(
				'Switching the new Traffic tab off failed:',
				getApiErrorCode( error ) ?? error
			);
			setHasFailed( true );
			setIsSwitchingOff( false );
			return;
		}

		const message = comment.trim();

		// After the write so a retry counts once, before the navigation so the beacon is not cut short.
		trackEvent( 'jetpack_premium_analytics_preview_disable', {
			...( rating === undefined ? {} : { rating } ),
			...( message ? { comment: message } : {} ),
		} );

		// Happiness gets the comment too; a failure there must not keep the reader here.
		if ( message ) {
			await submitStatsUserFeedback( {
				rating,
				comment: message,
				productName: PRODUCT_NAME,
			} ).catch( ( error: unknown ) => {
				// eslint-disable-next-line no-console -- swallowed on purpose, so this is the only trace
				console.warn( 'Exit feedback not delivered:', getApiErrorCode( error ) ?? error );
			} );
		}

		returnToClassicStats();
	}, [ comment, rating, trackEvent ] );

	return (
		<Dialog.Root open onOpenChange={ handleOpenChange }>
			<Dialog.Popup size="medium" initialFocus={ cancelRef }>
				<Dialog.Content>
					<Stack direction="column" gap="lg">
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
						</Stack>

						<ComparisonFields
							rating={ rating }
							onRatingChange={ setRating }
							comment={ comment }
							onCommentChange={ setComment }
							commentQuestion={ __(
								'What made you switch it off?',
								'jetpack-premium-analytics-pkg'
							) }
						/>

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
					<Dialog.Action ref={ cancelRef } variant="minimal" disabled={ isSwitchingOff }>
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
