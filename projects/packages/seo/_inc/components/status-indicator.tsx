import { __ } from '@wordpress/i18n';
import { border, drafts, published, Icon } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import clsx from 'clsx';
import styles from './status-indicator.module.scss';
import type { ComponentProps, FC } from 'react';

/**
 * The three completion states a Settings module can be in.
 */
export type SettingStatus = 'not-started' | 'in-progress' | 'complete';

// Label, glyph, and status-color class per state. Pre-resolved at module load
// (not per render). Icons: `border` (empty), `drafts` (partial), `published`
// (done) from the WordPress icon set — a natural "filling in" progression.
const STATES: Record<
	SettingStatus,
	{ label: string; icon: ComponentProps< typeof Icon >[ 'icon' ]; className: string }
> = {
	'not-started': {
		label: __( 'Not started', 'jetpack-seo' ),
		icon: border,
		className: styles.notStarted,
	},
	'in-progress': {
		label: __( 'In progress', 'jetpack-seo' ),
		icon: drafts,
		className: styles.inProgress,
	},
	complete: {
		label: __( 'Complete', 'jetpack-seo' ),
		icon: published,
		className: styles.complete,
	},
};

interface Props {
	status: SettingStatus;
}

/**
 * A compact completion indicator for a Settings module: the status label followed
 * by its icon (icon on the right), colored with the WPDS neutral / warning /
 * success tokens. Presentational — the caller decides which state applies and how
 * "complete" is defined for that module.
 *
 * @param props        - Component props.
 * @param props.status - The module's completion state.
 * @return The status indicator.
 */
const StatusIndicator: FC< Props > = ( { status } ) => {
	const { label, icon, className } = STATES[ status ];
	return (
		<span className={ clsx( styles.status, className ) }>
			<Text variant="body-sm" className={ styles.label }>
				{ label }
			</Text>
			<Icon icon={ icon } size={ 20 } />
		</span>
	);
};

export default StatusIndicator;
