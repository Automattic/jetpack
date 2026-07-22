/**
 * External dependencies
 */
import { Link } from '@wordpress/route';

export type VideoTitleLinkProps = {
	id?: number | string;
	label: string;
	link?: string | null;
	search?: Record< string, unknown >;
	classNames?: {
		internal?: string;
		external?: string;
		plain?: string;
	};
	title?: string;
};

/**
 * Render a video title as an internal detail link, an external fallback link,
 * or plain text.
 *
 * @param props            - Component props.
 * @param props.id         - Video attachment ID.
 * @param props.label      - Visible video title.
 * @param props.link       - External fallback URL.
 * @param props.search     - Search parameters for the detail route.
 * @param props.classNames - Optional classes for each rendering branch.
 * @param props.title      - Optional native title attribute.
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

	if ( link ) {
		return (
			<a
				className={ classNames?.external }
				href={ link }
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
