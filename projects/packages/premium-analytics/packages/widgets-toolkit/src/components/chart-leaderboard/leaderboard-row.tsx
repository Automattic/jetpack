/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { ExternalLink } from '../external-link';
import { InternalLink, type InternalLinkProps } from '../internal-link';
import { PostTitleLink } from '../post-title-link';
import { VideoTitleLink } from '../video-title-link';
import { ViewLiveLink, toViewLiveUrl } from '../view-live-link';
import { LeaderboardLabel, type LeaderboardRowMedia } from './leaderboard-label';
import styles from './leaderboard-label.module.scss';
import type { LeaderboardVariant } from './leaderboard-variant';
import type { MouseEvent, ReactElement } from 'react';

type LeaderboardRowLabelLink = Pick< InternalLinkProps, 'to' | 'params' | 'search' >;

export type LeaderboardRowAction =
	| { kind: 'link'; href: string }
	| {
			/** A row that stays put: a plain label with a "View in new tab" action beside it. */
			kind: 'viewLink';
			/** Public URL the action opens. Pass it through `safeHttpUrl()` first; this action does not check the scheme. */
			href: string;
	  }
	| {
			/** A post, page, or email with a detail page inside the dashboard. */
			kind: 'postLink';
			/** Post or page ID. Links to the internal detail route when the reader can open it. */
			id?: number | string;
			/** Public URL. The "View" action beside a title that opens the detail page; the link itself otherwise. */
			href?: string | null;
			/**
			 * Required, so a row cannot silently open the detail page on its own
			 * default range. Pass `{}` to navigate without a window on purpose.
			 */
			search: Record< string, unknown >;
			/** A trailing action beside "View", revealed with it. */
			extraAction?: ReactElement;
	  }
	| {
			/** A video with a detail page inside the dashboard. */
			kind: 'videoLink';
			/** Video ID. Rows carrying one link to the internal detail route. */
			id?: number | string;
			/** Public URL. The "View" action beside a title that opens the detail page; the link itself otherwise. */
			href?: string | null;
			/**
			 * Required, so a row cannot silently open the detail page on its own
			 * default range. Pass `{}` to navigate without a window on purpose.
			 */
			search: Record< string, unknown >;
			/** A trailing action beside "View", revealed with it. */
			extraAction?: ReactElement;
	  }
	| {
			kind: 'drillDown';
			onClick: ( event: MouseEvent< HTMLButtonElement > ) => void;
			/**
			 * A dashboard page the label itself opens, while the rest of the row
			 * still drills down.
			 */
			link?: LeaderboardRowLabelLink;
			/**
			 * Replaces the button name computed from its image alt and visible label.
			 * Without this, screen readers can announce the row label twice.
			 */
			ariaLabel: string;
	  }
	| {
			kind: 'static';
			/** A dashboard page the label opens. */
			link?: LeaderboardRowLabelLink;
	  };

export type LeaderboardRowActionOptions = {
	/** An external destination used only when the row has no children. */
	href?: string;
	/**
	 * How a childless row offers its `href`: as the row's own outbound link, or as
	 * a "View in new tab" action beside a plain label.
	 */
	hrefAs?: 'link' | 'viewLink';
	/** Whether selecting the row should take the user to a child leaderboard. */
	hasChildren: boolean;
	/** Drill-down behavior supplied by widgets that support child rows. */
	drillDown?: Omit< Extract< LeaderboardRowAction, { kind: 'drillDown' } >, 'kind' >;
};

/** The actions whose row keeps its label in place, so a trailing action has somewhere to go. */
export type LeaderboardRowActionWithTrailing = Extract<
	LeaderboardRowAction,
	{ kind: 'viewLink' | 'static' | 'drillDown' }
>;

export type LeaderboardRowProps = {
	/** Label text. */
	label: string;
	/** Media rendered before the label. */
	media: LeaderboardRowMedia;
	/** The look of the chart the row sits in. Only `list` insets the label and sizes the bar. */
	variant?: LeaderboardVariant;
} & (
	| {
			/** The mutually exclusive action applied to this chart row. */
			action: LeaderboardRowActionWithTrailing;
			/**
			 * A row action rendered after the label, revealed on hover or focus (with the
			 * "View" action when there is one).
			 */
			trailingAction?: ReactElement;
	  }
	| {
			/** Any action; a row that links out as a whole or opens a detail page has no room for another. */
			action: LeaderboardRowAction;
			trailingAction?: never;
	  }
);

type LeaderboardRowButtonProps = {
	label: ReactElement;
	onClick: ( event: MouseEvent< HTMLButtonElement > ) => void;
	ariaLabel: string;
};

export type LeaderboardRowChartProps =
	| ( LeaderboardRowButtonProps & { hasInteractiveLabel?: false } )
	| ( LeaderboardRowButtonProps & { hasInteractiveLabel: true } )
	| { label: ReactElement; onClick?: never; ariaLabel?: never };

/**
 * Resolve raw row navigation facts into one mutually exclusive action.
 *
 * Child rows take precedence over an external URL because a chart row cannot be a
 * button and hold interactive link content at the same time.
 *
 * @return The single action that the leaderboard row should expose.
 */
export function resolveLeaderboardRowAction(
	options: LeaderboardRowActionOptions & { hrefAs: 'viewLink' }
): LeaderboardRowActionWithTrailing;
export function resolveLeaderboardRowAction(
	options: LeaderboardRowActionOptions
): LeaderboardRowAction;
export function resolveLeaderboardRowAction(
	options: LeaderboardRowActionOptions
): LeaderboardRowAction {
	if ( options.hasChildren && options.drillDown ) {
		return { kind: 'drillDown', ...options.drillDown };
	}

	if ( ! options.hasChildren && options.href ) {
		return { kind: options.hrefAs ?? 'link', href: options.href };
	}

	return { kind: 'static' };
}

/**
 * Render the shared leaderboard row chrome around a label.
 *
 * Drill-down actions stay non-interactive here because `LeaderboardChart` turns the
 * whole row into a button.
 *
 * @return A single label element accepted by `LeaderboardEntry.label`.
 */
export function LeaderboardRow( {
	label,
	media,
	action,
	trailingAction,
	variant = 'list',
}: LeaderboardRowProps ): ReactElement {
	const rowClassName = clsx( styles.row, variant === 'bars' && styles.bars );
	const rowLinkClassName = clsx( styles.rowLink, variant === 'bars' && styles.bars );

	if ( action.kind === 'postLink' || action.kind === 'videoLink' ) {
		const TitleLink = action.kind === 'postLink' ? PostTitleLink : VideoTitleLink;
		const liveUrl = toViewLiveUrl(
			action.kind === 'postLink' ? 'post' : 'video',
			action.id,
			action.href
		);
		const content =
			media.kind !== 'none' ? (
				<LeaderboardLabel label={ label } media={ media } decorativeMedia />
			) : undefined;
		const titleLinkProps = {
			id: action.id,
			label,
			link: action.href,
			search: action.search,
			title: label,
		};

		// A row with a trailing action holds two controls, so the row chrome goes on a
		// wrapper and the title keeps the tooltip.
		if ( liveUrl !== undefined || action.extraAction ) {
			return (
				<span className={ rowClassName }>
					<TitleLink
						{ ...titleLinkProps }
						classNames={ {
							internal: clsx( styles.labelLink, styles.titleLink ),
							external: clsx( styles.labelLink, styles.titleLink ),
							plain: styles.plainLabel,
							text: styles.label,
						} }
					>
						{ content }
					</TitleLink>
					{ liveUrl !== undefined && (
						<ViewLiveLink href={ liveUrl } label={ label } className={ styles.rowAction } />
					) }
					{ action.extraAction && (
						<span className={ styles.rowAction }>{ action.extraAction }</span>
					) }
				</span>
			);
		}

		// With one link, the row chrome goes on the link itself.
		return (
			<TitleLink
				{ ...titleLinkProps }
				classNames={ {
					internal: rowLinkClassName,
					external: rowLinkClassName,
					plain: rowClassName,
					text: styles.label,
				} }
			>
				{ content }
			</TitleLink>
		);
	}

	const trailing = trailingAction && <span className={ styles.rowAction }>{ trailingAction }</span>;
	// A drill-down row's value slides over the label end on hover; keep the action clear of it.
	const trailingRowClassName = clsx(
		rowClassName,
		action.kind === 'drillDown' && trailing && styles.chevronReserve
	);

	if ( ( action.kind === 'drillDown' || action.kind === 'static' ) && action.link ) {
		return (
			<span className={ styles.row } title={ label }>
				<InternalLink { ...action.link } className={ styles.labelLink }>
					<LeaderboardLabel label={ label } media={ media } decorativeMedia />
				</InternalLink>
				{ trailing }
			</span>
		);
	}

	const content = (
		<LeaderboardLabel label={ label } media={ media } decorativeMedia={ action.kind === 'link' } />
	);

	// The label carries the tooltip itself, so each action keeps only its own.
	if ( action.kind === 'viewLink' || ( action.kind !== 'link' && trailing ) ) {
		return (
			<span className={ trailingRowClassName }>
				<span className={ styles.plainLabel } title={ label }>
					{ content }
				</span>
				{ action.kind === 'viewLink' && (
					<ViewLiveLink href={ action.href } label={ label } className={ styles.rowAction } />
				) }
				{ trailing }
			</span>
		);
	}

	if ( action.kind === 'link' ) {
		return (
			<ExternalLink className={ rowLinkClassName } href={ action.href } title={ label }>
				{ content }
			</ExternalLink>
		);
	}

	return (
		<span className={ rowClassName } title={ label }>
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
		const button = { label, onClick: props.action.onClick, ariaLabel: props.action.ariaLabel };

		return props.action.link || props.trailingAction
			? { ...button, hasInteractiveLabel: true }
			: button;
	}

	return { label };
}
