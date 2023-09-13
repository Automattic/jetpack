/**
 * Function to get duration of audio file
 *
 * @param {string} url - The url of the audio file
 * @returns {Promise<number>} The duration of the audio file
 * @see https://stackoverflow.com/questions/21522036/html-audio-tag-duration-always-infinity
 */
export function getDuration( url: string ): Promise< number > {
	return new Promise( next => {
		const tmpAudioInstance = new Audio( url );
		tmpAudioInstance.addEventListener(
			'durationchange',
			function () {
				if ( this.duration === Infinity ) {
					return;
				}

				const duration = this.duration;
				tmpAudioInstance.remove(); // remove instance from memory
				next( duration );
			},
			false
		);

		tmpAudioInstance.load();
		tmpAudioInstance.currentTime = 24 * 60 * 60; // Fake big time
		tmpAudioInstance.volume = 0;
		tmpAudioInstance.play(); // This will call `durationchange` event
	} );
}

type FormatTimeOptions = {
	/**
	 * Whether to add the decimal part to the formatted time.
	 *
	 */
	addDecimalPart?: boolean;
};

/**
 * Formats the given time in milliseconds into a string with the format HH:MM:SS.DD,
 * adding hours and minutes only when needed.
 *
 * @param {number} time               - The time in seconds to format.
 * @param {FormatTimeOptions} options - The arguments.
 * @returns {string}                    The formatted time string.
 * @example
 * const formattedTime1 = formatTime( 1234567 );                       // Returns "20:34.56"
 * const formattedTime2 = formatTime( 45123 );                         // Returns "45.12"
 * const formattedTime3 = formatTime( 64, { addDecimalPart: false } ); // Returns "01:04"
 */
export function formatTime(
	time: number,
	{ addDecimalPart = true }: FormatTimeOptions = {}
): string {
	time = time * 1000;
	const hours = Math.floor( time / 3600000 );
	const minutes = Math.floor( time / 60000 ) % 60;
	const seconds = Math.floor( time / 1000 ) % 60;
	const deciseconds = Math.floor( time / 10 ) % 100;

	const parts = [
		hours > 0 ? hours.toString().padStart( 2, '0' ) + ':' : '',
		hours > 0 || minutes > 0 ? minutes.toString().padStart( 2, '0' ) + ':' : '',
		seconds.toString().padStart( 2, '0' ),
	];

	if ( addDecimalPart ) {
		parts.push( '.' + deciseconds.toString().padStart( 2, '0' ) );
	}

	return parts.join( '' );
}
