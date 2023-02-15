/**
 * internal dependencies
 */
import { GetChapterArgs } from './types';

/**
 *
 * @param {GetChapterArgs} args - fetch chapter arguments.
 * @returns {Promise} The chapter.
 */

const getChapter = ( {
	guid,
	token,
	isPrivate,
	chapter,
}: GetChapterArgs ): Promise< string | null > => {
	return new Promise( ( resolve, reject ) => {
		const fetchChapterText = async () => {
			if ( ! chapter?.src ) {
				resolve( null );
			}
			if ( isPrivate && ! token ) {
				resolve( null );
			}

			const queryString = token
				? `?${ new URLSearchParams( { metadata_token: token } ).toString() }`
				: '';

			const chapterUrl = `https://videos.files.wordpress.com/${ guid }/${ chapter.src }${ queryString }`;

			const response = await fetch( chapterUrl );

			if ( ! response.ok ) {
				reject( new Error( `HTTP error! status: ${ response.status }` ) );
			}

			return await response.text();
		};

		resolve( await fetchChapterText() );
	} );
};

export default getChapter;
