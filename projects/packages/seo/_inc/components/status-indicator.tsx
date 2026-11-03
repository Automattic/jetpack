import { __ } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import styles from './status-indicator.module.scss';
import type { ComponentProps, FC } from 'react';

/**
 * The completion or editing status of a Settings module.
 */
export type SettingStatus = 'not-started' | 'incomplete' | 'complete' | 'plan-locked';

// Label and badge intent per state, resolved at module load so the production
// minifier can't fold the labels into one `__()` call.
const STATES: Record<
	SettingStatus,
	{ label: string; intent: ComponentProps< typeof Badge >[ 'intent' ] }
> = {
	'not-started': { label: __( 'Not started', 'jetpack-seo' ), intent: 'draft' },
	incomplete: { label: __( 'Incomplete', 'jetpack-seo' ), intent: 'medium' },
	'plan-locked': { label: __( 'Premium required', 'jetpack-seo' ), intent: 'draft' },
	complete: { label: __( 'Complete', 'jetpack-seo' ), intent: 'stable' },
};

interface Props {
	status: SettingStatus;
}

/**
 * A compact completion badge for a Settings module, matching the status badges
 * on the GEO crawler groups. Presentational — the caller decides which state
 * applies and how "complete" is defined for that module.
 *
 * @param props        - Component props.
 * @param props.status - The module's completion state.
 * @return The status badge.
 */
const StatusIndicator: FC< Props > = ( { status } ) => {
	const { label, intent } = STATES[ status ];
	return (
		<Badge intent={ intent } className={ styles.status }>
			{ label }
		</Badge>
	);
};

export default StatusIndicator;
