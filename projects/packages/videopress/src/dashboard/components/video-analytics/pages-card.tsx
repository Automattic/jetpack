import { __ } from '@wordpress/i18n';
import { Card, Link, Text } from '@wordpress/ui';
// Skeleton-row placeholder classes live in the shared stats stylesheet.
import '../stats/style.scss';
import './style.scss';
import type { ReactElement } from 'react';

const SKELETON_ROW_COUNT = 3;

type Props = {
	pages: string[];
	isLoading: boolean;
	isError: boolean;
};

/**
 * Human-friendly label for an embedding-page URL: scheme stripped,
 * trailing slash trimmed. The full URL stays on the link's `href`.
 *
 * @param url - Page URL as WPCOM reports it.
 * @return Display label.
 */
function pageLabel( url: string ): string {
	return url.replace( /^https?:\/\//, '' ).replace( /\/$/, '' );
}

/**
 * "Posts featuring this video" card for the per-video Analytics screen.
 * Lists the URLs of posts/pages embedding the video, as reported by the
 * WPCOM `stats/video/{post_id}` endpoint (`pages[]`). Structure mirrors
 * the Overview's ranking cards (card + single-column ARIA table +
 * skeleton rows) minus the metric column — upstream reports no per-page
 * counts.
 *
 * @param props           - Component props.
 * @param props.pages     - Embedding-page URLs for this video.
 * @param props.isLoading - When true, renders skeleton rows so the card height does not collapse.
 * @param props.isError   - When true, renders a quiet failure message in place of the list.
 * @return The card element.
 */
export default function PagesCard( { pages, isLoading, isError }: Props ): ReactElement {
	const isEmpty = ! isLoading && ! isError && pages.length === 0;

	let body: ReactElement;
	if ( isError ) {
		body = (
			<Text className="vp-video-analytics__list-empty">
				{ __( 'Could not load the posts featuring this video.', 'jetpack-videopress-pkg' ) }
			</Text>
		);
	} else if ( isEmpty ) {
		body = (
			<Text className="vp-video-analytics__list-empty">
				{ __( 'No posts feature this video yet.', 'jetpack-videopress-pkg' ) }
			</Text>
		);
	} else {
		body = (
			<div
				className="vp-video-analytics__list"
				role="table"
				aria-label={ __( 'Posts featuring this video', 'jetpack-videopress-pkg' ) }
			>
				<div className="vp-video-analytics__list-head" role="row">
					<span role="columnheader">{ __( 'POST', 'jetpack-videopress-pkg' ) }</span>
				</div>
				{ isLoading
					? Array.from( { length: SKELETON_ROW_COUNT } ).map( ( _, i ) => (
							<div key={ `skeleton-${ i }` } className="vp-video-analytics__list-row" role="row">
								<span role="cell">
									<span className="vp-overview__skeleton-block" />
								</span>
							</div>
					  ) )
					: pages.map( ( page, i ) => (
							<div key={ `${ page }-${ i }` } className="vp-video-analytics__list-row" role="row">
								<span role="cell">
									{ /* openInNewTab (not a raw target attribute — Link's own
									     merge would drop it) also appends the accessible
									     "(opens in a new tab)" affordance. */ }
									<Link
										tone="neutral"
										variant="unstyled"
										href={ page }
										openInNewTab
										rel="noopener noreferrer"
									>
										{ pageLabel( page ) }
									</Link>
								</span>
							</div>
					  ) ) }
			</div>
		);
	}

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Posts featuring this video', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>{ body }</Card.Content>
		</Card.Root>
	);
}
