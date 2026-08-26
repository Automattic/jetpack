/**
 * External dependencies
 */
import { Link } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import { PostTitleLink } from '../post-title-link';
import { VideoTitleLink } from '../video-title-link';
import { LeaderboardLabel, type LeaderboardRowMedia } from './leaderboard-label';
import styles from './leaderboard-label.module.scss';
import type { MouseEvent, ReactElement } from 'react';

export type LeaderboardRowAction =
	| { kind: 'link'; href: string }
	| {
			/** A post, page, or email with a detail page inside the dashboard. */
			kind: 'postLink';
			/** Post or page ID. Rows carrying one link to the internal detail route. */
			id?: number | string;
			/** Public URL. It becomes the link itself when there is no post ID. */
			href?: string | null;
			/**
			 * Required, so a row cannot silently open the detail page on its own
			 * default range. Pass `{}` to navigate without a window on purpose.
			 */
			search: Record< string, unknown >;
	  }
	| {
			/** A video with a detail page inside the dashboard. */
			kind: 'videoLink';
			/** Video ID. Rows carrying one link to the internal detail route. */
			id?: number | string;
			/** Public URL. It becomes the link itself when there is no video ID. */
			href?: string | null;
			/**
			 * Required, so a row cannot silently open the detail page on its own
			 * default range. Pass `{}` to navigate without a window on purpose.
			 */
			search: Record< string, unknown >;
	  }
	| {
			kind: 'drillDown';
			onClick: ( event: MouseEvent< HTMLButtonElement > ) => void;
			/**
			 * Replaces the button name computed from its image alt and visible label.
			 * Without this, screen readers can announce the row label twice.
			 */
			ariaLabel: string;
	  }
	| { kind: 'static' };

export type LeaderboardRowActionOptions = {
	/** An external destination used only when the row has no children. */
	href?: string;
	/** Whether selecting the row should take the user to a child leaderboard. */
	hasChildren: boolean;
	/** Drill-down behavior supplied by widgets that support child rows. */
	drillDown?: Omit< Extract< LeaderboardRowAction, { kind: 'drillDown' } >, 'kind' >;
};

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
 * Resolve raw row navigation facts into one mutually exclusive action.
 *
 * Child rows take precedence over an external URL because chart rows cannot
 * be buttons and contain interactive link content at the same time. A URL is
 * therefore used only for a childless row; otherwise the row stays static.
 *
 * @return The single action that the leaderboard row should expose.
 */
export function resolveLeaderboardRowAction(
	options: LeaderboardRowActionOptions
): LeaderboardRowAction {
	if ( options.hasChildren && options.drillDown ) {
		return { kind: 'drillDown', ...options.drillDown };
	}

	if ( ! options.hasChildren && options.href ) {
		return { kind: 'link', href: options.href };
	}

	return { kind: 'static' };
}

/**
 * Render the shared leaderboard row chrome around a label.
 *
 * Drill-down actions stay non-interactive here because `LeaderboardChart` turns
 * the whole row into a button; `buildLeaderboardRow` passes that action to the
 * chart.
 *
 * @return A single label element accepted by `LeaderboardEntry.label`.
 */
export function LeaderboardRow( { label, media, action }: LeaderboardRowProps ): ReactElement {
	// Title-link rows carry no media, so the row chrome goes on the title element.
	if ( action.kind === 'postLink' || action.kind === 'videoLink' ) {
		const TitleLink = action.kind === 'postLink' ? PostTitleLink : VideoTitleLink;

		return (
			<TitleLink
				id={ action.id }
				label={ label }
				link={ action.href }
				search={ action.search }
				title={ label }
				classNames={ {
					internal: styles.rowLink,
					external: styles.rowLink,
					plain: styles.row,
					text: styles.label,
				} }
			/>
		);
	}

	const content = (
		<LeaderboardLabel label={ label } media={ media } decorativeMedia={ action.kind === 'link' } />
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
