/**
 * External dependencies
 */
import { Link } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { LeaderboardLabelContent, type LeaderboardRowMedia } from './leaderboard-label';
import styles from './leaderboard-label.module.scss';
import type { MouseEvent, ReactElement } from 'react';

export type LeaderboardRowAction =
	| { kind: 'link'; href: string }
	| {
			kind: 'drillDown';
			onClick: ( event: MouseEvent< HTMLButtonElement > ) => void;
			ariaLabel: string;
	  }
	| { kind: 'static' };

export type LeaderboardRowProps = {
	/** Label text. */
	label: string;
	/** Media rendered before the label. */
	media: LeaderboardRowMedia;
	/** The mutually exclusive action applied to this chart row. */
	action: LeaderboardRowAction;
};

export type LeaderboardRowChartProps =
	| {
			label: ReactElement;
			onClick: ( event: MouseEvent< HTMLButtonElement > ) => void;
			ariaLabel: string;
	  }
	| { label: ReactElement; onClick?: never; ariaLabel?: never };

/**
 * Render the shared leaderboard row chrome around a label.
 *
 * Link actions own the anchor and its new-tab affordance. Drill-down actions
 * stay non-interactive here because `LeaderboardChart` turns the whole row
 * into a button; `buildLeaderboardRow` passes that action to the chart.
 *
 * @param props        - Component props.
 * @param props.label  - Label text.
 * @param props.media  - Media rendered before the label.
 * @param props.action - The row action.
 * @return A single label element accepted by `LeaderboardEntry.label`.
 */
export function LeaderboardRow( { label, media, action }: LeaderboardRowProps ): ReactElement {
	const content = (
		<LeaderboardLabelContent
			label={ label }
			media={ media }
			decorativeMedia={ action.kind === 'link' }
		/>
	);

	if ( action.kind === 'link' ) {
		return (
			<Link
				className={ styles.rowLink }
				href={ action.href }
				variant="unstyled"
				openInNewTab
				title={ label }
			>
				{ content }
			</Link>
		);
	}

	return (
		<span className={ styles.row } title={ label }>
			{ content }
		</span>
	);
}

/**
 * Build the label and chart-level interaction props for one leaderboard row.
 *
 * @param props - Leaderboard row content and action.
 * @return Props to spread onto a `LeaderboardEntry`.
 */
export function buildLeaderboardRow( props: LeaderboardRowProps ): LeaderboardRowChartProps {
	const label = <LeaderboardRow { ...props } />;

	if ( props.action.kind === 'drillDown' ) {
		return {
			label,
			onClick: props.action.onClick,
			ariaLabel: props.action.ariaLabel,
		};
	}

	return { label };
}
