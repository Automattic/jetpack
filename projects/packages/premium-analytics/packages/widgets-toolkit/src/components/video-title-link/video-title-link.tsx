/**
 * External dependencies
 */
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
/**
 * Internal dependencies
 */
import { ExternalLink } from '../external-link';
import { InternalLink } from '../internal-link';
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
			<InternalLink
				className={ classNames?.internal }
				title={ title }
				to="/video/$videoId"
				params={ { videoId: String( videoId ) } }
				search={ search }
			>
				{ content }
			</InternalLink>
		);
	}

	// Callers pass `link` straight from report data, so the scheme is guarded
	// here at the sink rather than in each consuming widget or route.
	const href = safeHttpUrl( link );

	if ( href ) {
		return (
			<ExternalLink className={ classNames?.external } href={ href } title={ title }>
				{ content }
			</ExternalLink>
		);
	}

	return (
		<span className={ classNames?.plain } title={ title }>
			{ content }
		</span>
	);
}
