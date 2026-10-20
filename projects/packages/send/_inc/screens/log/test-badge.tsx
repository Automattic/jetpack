import { __ } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';

export type TestBadgeProps = {
	className?: string;
};

/**
 * The "Test" badge shown next to the subject of every test email (`source === 'test'`).
 *
 * @param props           - Component props.
 * @param props.className - Extra class for the badge.
 * @return The badge.
 */
const TestBadge = ( { className }: TestBadgeProps ) => (
	<Badge intent="informational" className={ className }>
		{ __( 'Test', 'jetpack-send-pkg' ) }
	</Badge>
);

export default TestBadge;
