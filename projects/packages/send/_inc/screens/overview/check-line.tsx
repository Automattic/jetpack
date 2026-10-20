import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import { lastCheckedLabel } from './setup-step';

type Props = {
	lastCheckedAt: Date | null;
	checking: boolean;
	onCheckNow: () => void;
	/** Extra sentence before the time, e.g. "We've stopped checking automatically." */
	prefix?: string;
};

/**
 * Re-render on an interval so relative times stay current.
 *
 * @param intervalMs - How often to tick.
 * @return The current time in ms.
 */
export function useNow( intervalMs: number ): number {
	const [ now, setNow ] = useState( () => Date.now() );
	useEffect( () => {
		const id = window.setInterval( () => setNow( Date.now() ), intervalMs );
		return () => window.clearInterval( id );
	}, [ intervalMs ] );
	return now;
}

/**
 * "Last checked 3 min ago · Check now". Only the prefix is live: the ticking time stays quiet.
 *
 * @param props               - Component props.
 * @param props.lastCheckedAt - When the records were last looked up.
 * @param props.checking      - A check is in flight.
 * @param props.onCheckNow    - Check right away.
 * @param props.prefix        - Optional sentence before the time.
 * @return The line.
 */
const CheckLine = ( { lastCheckedAt, checking, onCheckNow, prefix }: Props ) => {
	const now = useNow( 30000 );
	let label: string = __( 'Checking every minute', 'jetpack-send-pkg' );
	if ( checking ) {
		label = __( 'Checking…', 'jetpack-send-pkg' );
	} else if ( lastCheckedAt ) {
		label = lastCheckedLabel( lastCheckedAt, now );
	}

	return (
		<Stack direction="row" gap="sm" align="center" wrap="wrap">
			<Text variant="body-md" className="jetpack-send-muted">
				<span role="status">{ prefix ? `${ prefix } ` : '' }</span>
				{ label }
			</Text>
			<Button
				variant="minimal"
				tone="neutral"
				size="compact"
				onClick={ onCheckNow }
				disabled={ checking }
			>
				{ __( 'Check now', 'jetpack-send-pkg' ) }
			</Button>
		</Stack>
	);
};

export default CheckLine;
