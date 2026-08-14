/**
 * File builders for anything that goes through the dropzone's accepted-file
 * filter (`components/upload-dropzone/video-files`). That filter reads a file's
 * leading bytes and checks them against the container its extension claims, so
 * a test file built from `[ 'x' ]` is no longer a video no matter what MIME
 * type it is given — the byte content has to be right.
 */

import { act } from '@testing-library/react';

// A minimal ISO-BMFF header: a 24-byte `ftyp` box branded `isom`. Enough for
// the container check, which reads the box type at offset 4; the rest of a real
// mp4 (moov/mdat) is irrelevant to it. Covers .mp4, .m4v, .mov and the 3gp
// family, which share the format.
const ISO_BMFF_HEADER = new Uint8Array( [
	0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
	0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
] );

/**
 * A file that really is the video its name claims: correct container bytes,
 * so it survives the dropzone filter end to end.
 *
 * @param name - File name, including the extension.
 * @param type - Reported MIME type. Defaults to `video/mp4`.
 * @return The file.
 */
export function makeVideoFile( name: string, type = 'video/mp4' ): File {
	return new File( [ ISO_BMFF_HEADER ], name, { type } );
}

/**
 * The bug both testers reproduced: a text file renamed to a video extension.
 * Chromium derives `File.type` from the extension, so this reports `video/mp4`
 * exactly as the real thing does — which is why the default type here is
 * `video/mp4` and not `text/plain`. Only the bytes give it away.
 *
 * @param name - File name, including the (video) extension.
 * @param type - Reported MIME type. Defaults to the `video/mp4` a browser
 *             would report for a `.mp4` name.
 * @return The file.
 */
export function makeRenamedTextFile( name: string, type = 'video/mp4' ): File {
	return new File(
		[ 'This is a plain text file that somebody renamed. It is not a video.\n' ],
		name,
		{ type }
	);
}

/**
 * Let the accepted-file filter settle after a drop or a pick. It reads each
 * file's header, so the hand-off to `onFiles` — or the refusal notice — lands a
 * task after the event rather than during it. Two ticks: one for the read, one
 * for the promise chain that follows it.
 *
 * @return Resolves once the pending file checks have run.
 */
export async function settleFileCheck(): Promise< void > {
	await act( async () => {
		await new Promise( resolve => setTimeout( resolve, 0 ) );
		await new Promise( resolve => setTimeout( resolve, 0 ) );
	} );
}
