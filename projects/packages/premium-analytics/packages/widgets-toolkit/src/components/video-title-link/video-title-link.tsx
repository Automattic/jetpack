/**
 * External dependencies
 */
import { Link as UiLink } from '@jetpack-premium-analytics/externals';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { Link } from '@wordpress/route';

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
};

/**
 * Render a video title as an internal detail link, an external fallback link,
 * or plain text. `search` takes either an object or an updater that receives
 * the current search. Mirrors `PostTitleLink`'s structure so post and video
 * rows read identically across the dashboard.
 *
 * @return The linked or plain video title.
 */
export function VideoTitleLink( {
	id,
	label,
	link,
	search,
	classNames,
	title,
}: VideoTitleLinkProps ): JSX.Element {
	const videoId = Number( id );
	const text = <span className={ classNames?.text }>{ label }</span>;

	if ( Number.isInteger( videoId ) && videoId > 0 ) {
		// `UiLink` renders the router link so the anchor keeps the design
		// system's unlayered guard, without which wp-admin repaints it blue.
		return (
			<UiLink
				className={ classNames?.internal }
				variant="unstyled"
				title={ title }
				render={
					<Link
						to="/video/$videoId"
						params={ { videoId: String( videoId ) } as unknown as never }
						search={ search as unknown as never }
					/>
				}
			>
				{ text }
			</UiLink>
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
				{ text }
			</UiLink>
		);
	}

	return (
		<span className={ classNames?.plain } title={ title }>
			{ text }
		</span>
	);
}
