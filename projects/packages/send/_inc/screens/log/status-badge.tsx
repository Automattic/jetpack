import { __ } from '@wordpress/i18n';
import { Badge, Tooltip, VisuallyHidden } from '@wordpress/ui';
import type { LogRow } from '../../data/types';

const STATUS_INTENT = { sent: 'stable', fallback: 'medium', failed: 'high' } as const;

/**
 * Translated status labels.
 *
 * @return Labels keyed by status.
 */
export const statusLabels = (): Record< LogRow[ 'status' ], string > => ( {
	sent: __( 'Sent', 'jetpack-send-pkg' ),
	fallback: __( 'Fallback', 'jetpack-send-pkg' ),
	failed: __( 'Failed', 'jetpack-send-pkg' ),
} );

/**
 * A log row's creation time in the viewer's locale.
 *
 * @param createdAt - UTC `Y-m-d H:i:s` from the log table.
 * @return The formatted date and time.
 */
export const logDate = ( createdAt: string ) =>
	new Date( `${ createdAt.replace( ' ', 'T' ) }Z` ).toLocaleString();

type Props = {
	status: LogRow[ 'status' ];
	/** Shown in a tooltip on the badge. */
	error?: string;
};

const StatusBadge = ( { status, error }: Props ) => {
	const badge = <Badge intent={ STATUS_INTENT[ status ] }>{ statusLabels()[ status ] }</Badge>;
	if ( ! error ) {
		return badge;
	}

	return (
		<Tooltip.Root>
			<Tooltip.Trigger className="jetpack-send-status-trigger">
				{ badge }
				<VisuallyHidden>{ error }</VisuallyHidden>
			</Tooltip.Trigger>
			<Tooltip.Popup>{ error }</Tooltip.Popup>
		</Tooltip.Root>
	);
};

export default StatusBadge;
