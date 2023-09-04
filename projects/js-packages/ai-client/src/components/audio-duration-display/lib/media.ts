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
