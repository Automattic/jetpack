/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	chapterStartAtToSeconds,
	formatChapterTime,
} from '../../utils/video-chapters/chapter-time';
import extractVideoChapters from '../../utils/video-chapters/extract-video-chapters';
import './styles.scss';
/**
 * Types
 */
import type { ReactElement } from 'react';

type ChapterOutlineProps = {
	description: string;
};

/**
 * Read-only outline of a video's chapters, parsed from its description.
 * Shared by the block editor Chapters panel and the dashboard Chapters card.
 *
 * @param props             - Component props.
 * @param props.description - The current video description.
 * @return The chapter list, or an explanatory empty state.
 */
export default function ChapterOutline( { description }: ChapterOutlineProps ): ReactElement {
	const chapters = useMemo( () => extractVideoChapters( description ), [ description ] );

	if ( ! chapters.length ) {
		return (
			<p className="videopress-chapter-outline__empty">
				{ __(
					'Chapters help viewers navigate long videos. Add timestamps and titles to create them.',
					'jetpack-videopress-pkg'
				) }
			</p>
		);
	}

	return (
		<ul className="videopress-chapter-outline">
			{ /* Index keys are safe here: the list is read-only and fully derived from the description. */ }
			{ chapters.map( ( chapter, index ) => (
				<li key={ index }>
					<span className="videopress-chapter-outline__time">
						{ formatChapterTime( chapterStartAtToSeconds( chapter.startAt ) ) }
					</span>
					<span className="videopress-chapter-outline__title">{ chapter.title }</span>
				</li>
			) ) }
		</ul>
	);
}
