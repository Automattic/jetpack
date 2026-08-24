/**
 * External dependencies
 */
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
	};
	title?: string;
};

/**
 * Render a video title as an internal detail link, an external fallback link,
 * or plain text. `search` takes either an object or an updater that receives
 * the current search.
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

	if ( Number.isInteger( videoId ) && videoId > 0 ) {
		return (
			<Link
				className={ classNames?.internal }
				to="/video/$videoId"
				params={ { videoId: String( videoId ) } as unknown as never }
				search={ search as unknown as never }
				title={ title }
			>
				{ label }
			</Link>
		);
	}

	// Callers pass `link` straight from report data, so the scheme is guarded
	// here at the sink rather than in each consuming widget or route.
	const href = safeHttpUrl( link );

	if ( href ) {
		return (
			<a
				className={ classNames?.external }
				href={ href }
				target="_blank"
				rel="noopener noreferrer"
				title={ title }
			>
				{ label }
			</a>
		);
	}

	return (
		<span className={ classNames?.plain } title={ title }>
			{ label }
		</span>
	);
}
