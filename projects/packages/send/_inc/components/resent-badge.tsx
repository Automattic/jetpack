import { __ } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';

export type ResentBadgeProps = {
	className?: string;
};

/**
 * The "Resent" badge shown next to the subject of every copy sent again from the Log
 * (`source === 'resend'`). Neutral, so it reads differently from the blue Test badge.
 *
 * @param props           - Component props.
 * @param props.className - Extra class for the badge.
 * @return The badge.
 */
export const ResentBadge = ( { className }: ResentBadgeProps ) => (
	<Badge intent="none" className={ className }>
		{ __( 'Resent', 'jetpack-send-pkg' ) }
	</Badge>
);

export default ResentBadge;
