import { useBlockProps } from '@wordpress/block-editor';

interface SaveProps {
	attributes: {
		mediaUrl?: string;
		mediaType?: 'audio' | 'video';
		mediaMimeType?: string;
		duration?: string;
		showPoster?: boolean;
		coverArt?: { url?: string };
	};
}

/**
 * Static save output.
 *
 * The dynamic PHP render callback owns the rich front-end render (post title,
 * author, date, season/episode metadata, cover-art fallback chain, and
 * schema.org markup). It bails to this saved markup in every other context, so
 * we persist a real, self-contained player built from the block's own
 * attributes. That makes the episode render natively in the Reader, RSS, email,
 * and AMP instead of collapsing to a bare link.
 *
 * Only locale-independent attribute values are emitted here. Translated labels
 * (Season / Episode / Trailer …) are deliberately left to the dynamic render:
 * baking translated strings into saved markup freezes them to the author's
 * editor locale and breaks block validation when the post is later edited in a
 * different locale. Post-derived fields (title, author, date) aren't block
 * attributes, and the surrounding context (Reader card, feed item, post header)
 * already presents them.
 *
 * @param props            - Block save props.
 * @param props.attributes - Block attributes.
 * @return The serialized block markup, or null when there is no media to play.
 */
export default function save( { attributes }: SaveProps ) {
	const { mediaUrl, mediaType, mediaMimeType, duration, showPoster = true, coverArt } = attributes;

	if ( ! mediaUrl ) {
		return null;
	}

	const blockProps = useBlockProps.save();
	const coverUrl = coverArt?.url || '';

	return (
		<div { ...blockProps }>
			<article className="jetpack-podcast-episode">
				{ showPoster && coverUrl && (
					<figure className="jetpack-podcast-episode__poster">
						<img src={ coverUrl } alt="" />
					</figure>
				) }
				<div className="jetpack-podcast-episode__body">
					{ !! duration && (
						<p className="jetpack-podcast-episode__byline">
							<span className="jetpack-podcast-episode__duration">{ duration }</span>
						</p>
					) }
					<div className="jetpack-podcast-episode__player">
						{ mediaType === 'video' ? (
							<video
								src={ mediaUrl }
								controls
								preload="none"
								poster={ showPoster && coverUrl ? coverUrl : undefined }
								data-mime={ mediaMimeType || undefined }
							/>
						) : (
							<audio src={ mediaUrl } controls preload="none" />
						) }
					</div>
				</div>
			</article>
		</div>
	);
}
