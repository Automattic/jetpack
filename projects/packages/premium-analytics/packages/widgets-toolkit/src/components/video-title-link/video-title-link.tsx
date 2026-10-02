/**
 * External dependencies
 */
import { Link as UiLink } from '@jetpack-premium-analytics/externals';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { Link } from '@wordpress/route';
import type { JSX, ReactNode } from 'react';

export type VideoTitleLinkProps = {
	id?: number | string;
	label: string;
	link?: string | null;
	search?:
		| Record< string, unknown >
		| ( ( current: Record< string, unknown > ) => Record< string, unknown > );
	classNames?: {
		internal?: string;
		external?: string;
		plain?: string;
		text?: string;
	};
	title?: string;
	/** Replaces the default label text inside the link or plain wrapper. */
	children?: ReactNode;
};

export type VideoDetailLinkProps = {
	videoId: number;
	search?: VideoTitleLinkProps[ 'search' ];
	className?: string;
	title?: string;
	tabIndex?: number;
	'aria-hidden'?: boolean;
	children: ReactNode;
};

/**
 * Render children as a link to the internal video detail page.
 */
export function VideoDetailLink( {
	videoId,
	search,
	className,
	title,
	tabIndex,
	'aria-hidden': ariaHidden,
	children,
}: VideoDetailLinkProps ): JSX.Element {
	// `UiLink` renders the router link so the anchor keeps the design
	// system's unlayered guard, without which wp-admin repaints it blue.
	return (
		<UiLink
			className={ className }
			variant="unstyled"
			title={ title }
			tabIndex={ tabIndex }
			aria-hidden={ ariaHidden }
			render={
				<Link
					to="/video/$videoId"
					params={ { videoId: String( videoId ) } as unknown as never }
					search={ search as unknown as never }
				/>
			}
		>
			{ children }
		</UiLink>
	);
}

/**
 * Render a video title as an internal detail link, an external fallback link, or plain
 * text. Mirrors `PostTitleLink`'s structure so post and video rows read identically.
 */
export function VideoTitleLink( {
	id,
	label,
	link,
	search,
	classNames,
	title,
	children,
}: VideoTitleLinkProps ): JSX.Element {
	const videoId = Number( id );
	const content = children ?? <span className={ classNames?.text }>{ label }</span>;

	if ( Number.isInteger( videoId ) && videoId > 0 ) {
		return (
			<VideoDetailLink
				videoId={ videoId }
				search={ search }
				className={ classNames?.internal }
				title={ title }
			>
				{ content }
			</VideoDetailLink>
		);
	}

	// Callers pass `link` straight from report data, so the scheme is guarded
	// here at the sink rather than in each consuming widget or route.
	const href = safeHttpUrl( link );

	if ( href ) {
		// `openInNewTab` appends the design system's outbound marker, so the row
		// carries the same arrow as every other external link in the dashboard.
		return (
			<UiLink
				className={ classNames?.external }
				href={ href }
				variant="unstyled"
				openInNewTab
				rel="noopener noreferrer"
				title={ title }
			>
				{ content }
			</UiLink>
		);
	}

	return (
		<span className={ classNames?.plain } title={ title }>
			{ content }
		</span>
	);
}
