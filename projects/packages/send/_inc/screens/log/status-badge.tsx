import { __ } from '@wordpress/i18n';
import { Badge, Text, Tooltip, VisuallyHidden } from '@wordpress/ui';
import type { LogRow } from '../../data/types';

const STATUS_INTENT = { sent: 'stable', fallback: 'medium', failed: 'high' } as const;

/**
 * Translated status labels.
 *
 * @return Labels keyed by status.
 */
export const statusLabels = (): Record< LogRow[ 'status' ], string > => ( {
	sent: __( 'Sent', 'jetpack-send-pkg' ),
	fallback: __( 'Sent by your host', 'jetpack-send-pkg' ),
	failed: __( 'Failed', 'jetpack-send-pkg' ),
} );

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
				<VisuallyHidden render={ <span /> }>{ error }</VisuallyHidden>
			</Tooltip.Trigger>
			<Tooltip.Popup>
				<Text variant="body-md">{ error }</Text>
			</Tooltip.Popup>
		</Tooltip.Root>
	);
};

export default StatusBadge;
