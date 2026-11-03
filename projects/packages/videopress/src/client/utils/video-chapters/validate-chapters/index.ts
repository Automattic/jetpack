import { validateRows } from '../description';
import type { ChapterValidationIssue } from '../description';
import type { VideoPressChapter } from '../types';

/**
 * Get the validation issues for chapters extracted from a description.
 *
 * @param chapters - The chapters to validate.
 * @return Issues preventing the chapters from being saved.
 */
export function getChapterValidationIssues(
	chapters: VideoPressChapter[]
): ChapterValidationIssue[] {
	const rows = ( chapters ?? [] ).map( ( { startAt, title } ) => {
		const [ hours, minutes, seconds ] = startAt.split( ':' ).map( Number );
		return { startAtSeconds: hours * 3600 + minutes * 60 + seconds, title };
	} );

	return validateRows( rows ).issues;
}

/**
 * Validate chapters extracted from a description.
 *
 * @param chapters - The chapters to validate.
 * @return Whether the chapters can be saved.
 */
export default function validateChapters( chapters: VideoPressChapter[] ): boolean {
	return getChapterValidationIssues( chapters ).length === 0;
}
