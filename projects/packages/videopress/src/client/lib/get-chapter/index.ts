/**
 * internal dependencies
 */
import { GetChapterArgs } from './types';

/**
 *
 * @param {GetChapterArgs} args - fetch chapter arguments.
 * @returns {Promise} The chapter.
 */

const getChapter = async ( {
	guid,
	token,
	isPrivate,
	chapter,
}: GetChapterArgs ): Promise< string | null > => {
	if ( ! chapter?.src ) {
		return;
	}
	if ( isPrivate && ! token ) {
		return;
	}

	const queryString = token
		? `?${ new URLSearchParams( { metadata_token: token } ).toString() }`
		: '';

	const chapterUrl = `https://videos.files.wordpress.com/${ guid }/${ chapter.src }${ queryString }`;

	const response = await fetch( chapterUrl );

	if ( ! response.ok ) {
		throw new Error( `HTTP error! status: ${ response.status }` );
	}

	return await response.text();
};

export default getChapter;
