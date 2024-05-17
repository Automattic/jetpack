/**
 * Pretty basic helper to check if a file is a video
 * based on its mime type.
 *
 * @param {File} file - File to check.
 * @returns {boolean}   Whether the file is a video.
 */
export function isVideoFile( file: File ): boolean {
	if ( ! file?.type ) {
		return false;
	}

	return file.type.startsWith( 'video/' );
}

/**
 * Filter an array of files to only include video files.
 *
 * @param {File[]} files - Array of files to filter.
 * @returns {File[]}       Array of video files.
 */
export function filterVideoFiles( files: File[] ): File[] {
	return files.filter( isVideoFile );
}
