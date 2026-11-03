import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Spinner, Stack, Text } from '@wordpress/ui';
import { useNow } from '../check-line';
import { lastCheckedLabel } from '../setup-step';

type Props = {
	/** The live title, e.g. "Still looking for 1 record" */
	lead: string;
	/** What happens next; not live. */
	detail: string;
	lastCheckedAt: Date | null;
	checking: boolean;
	onCheckNow: () => void;
};

/**
 * "Still looking for 1 record" at the foot of the records card, laid out like a record row.
 *
 * @param props               - Component props.
 * @param props.lead          - The title, announced when it changes.
 * @param props.detail        - The rest, read only on demand.
 * @param props.lastCheckedAt - When the records were last looked up.
 * @param props.checking      - A check is in flight.
 * @param props.onCheckNow    - Check right away.
 * @return The note.
 */
const WaitingNote = ( { lead, detail, lastCheckedAt, checking, onCheckNow }: Props ) => {
	const now = useNow( 30000 );
	// Background polls stay quiet; only a check the person asked for shows on the button.
	const [ manual, setManual ] = useState( false );
	useEffect( () => {
		if ( ! checking ) {
			setManual( false );
		}
	}, [ checking ] );
	const checkNow = useCallback( () => {
		setManual( true );
		onCheckNow();
	}, [ onCheckNow ] );
	let checked: string = __( 'Checking every minute', 'jetpack-send-pkg' );
	if ( checking ) {
		checked = __( 'Checking…', 'jetpack-send-pkg' );
	} else if ( lastCheckedAt ) {
		checked = lastCheckedLabel( lastCheckedAt, now );
	}

	return (
		<Stack direction="column" gap="sm" className="jetpack-send-setup__waiting">
			<Stack direction="row" align="center" justify="space-between" gap="sm" wrap="wrap">
				<Stack direction="row" align="center" gap="sm">
					<span className="jetpack-send-setup__waiting-icon">
						<Spinner />
					</span>
					<Text variant="body-lg" role="status">
						{ lead }
					</Text>
				</Stack>
				<Button
					variant="minimal"
					tone="neutral"
					size="compact"
					onClick={ checkNow }
					loading={ manual && checking }
					loadingAnnouncement={ __( 'Checking…', 'jetpack-send-pkg' ) }
				>
					{ __( 'Check now', 'jetpack-send-pkg' ) }
				</Button>
			</Stack>
			<Text variant="body-lg" render={ <p /> } className="jetpack-send-setup__weak">
				{ detail }
			</Text>
			<Text variant="body-md" className="jetpack-send-setup__weak">
				{ checked }
			</Text>
		</Stack>
	);
};

export default WaitingNote;
