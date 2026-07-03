import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
import {
	chapterStartAtToSeconds,
	formatChapterTime,
} from '../../../client/utils/video-chapters/chapter-time';
import extractVideoChapters from '../../../client/utils/video-chapters/extract-video-chapters';
import type { ReactElement } from 'react';

type Props = {
	description: string;
	onManageChapters: () => void;
};

/**
 * Card surfacing the video's chapters: a read-only list parsed from the
 * description, and the entry point to the chapter manager modal.
 *
 * @param props                  - Component props.
 * @param props.description      - The current (possibly unsaved) description.
 * @param props.onManageChapters - Opens the chapter manager modal.
 * @return The card element.
 */
export default function ChaptersCard( { description, onManageChapters }: Props ): ReactElement {
	const chapters = extractVideoChapters( description );

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Chapters', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				{ chapters.length ? (
					<ul className="vp-video-details__chapters-list">
						{ chapters.map( chapter => (
							<li key={ `${ chapter.startAt }-${ chapter.title }` }>
								<span className="vp-video-details__chapters-time">
									{ formatChapterTime( chapterStartAtToSeconds( chapter.startAt ) ) }
								</span>
								<span className="vp-video-details__chapters-title">{ chapter.title }</span>
							</li>
						) ) }
					</ul>
				) : (
					<p className="vp-video-details__chapters-empty">
						{ __(
							'Chapters help viewers navigate long videos. Add timestamps and titles to create them.',
							'jetpack-videopress-pkg'
						) }
					</p>
				) }
				<Button variant="secondary" onClick={ onManageChapters }>
					{ __( 'Manage chapters', 'jetpack-videopress-pkg' ) }
				</Button>
			</Card.Content>
		</Card.Root>
	);
}
