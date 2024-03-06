/**
 * External dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const MAX_AUDIO_SIZE = 25000000; // 25MB
const MAX_AUDIO_DURATION = 25 * 60; // 25 minutes
const ALLOWED_MEDIA_TYPES = [
	'audio/mpeg',
	'audio/mp3',
	'audio/ogg',
	'audio/flac',
	'audio/x-flac',
	'audio/m4a',
	'audio/x-m4a',
	'audio/mp4',
	'audio/wav',
	'audio/wave',
	'audio/x-wav',
	'audio/webm',
];

/**
 * The return value for the audio validation hook.
 */
export type UseAudioValidationReturn = {
	isValidatingAudio: boolean;
	validateAudio: (
		audio: Blob,
		successCallback: ( info?: ValidatedAudioInformation ) => void,
		errorCallback: ( error: string ) => void
	) => void;
};

/**
 * The validated audio information.
 */
export type ValidatedAudioInformation = {
	duration: number;
	isFile: boolean;
	size: number;
};

/**
 * Hook to handle the validation of an audio file.
 *
 * @returns {UseAudioValidationReturn} - Object with the audio validation state and the function to validate the audio.
 */
export default function useAudioValidation(): UseAudioValidationReturn {
	const [ isValidatingAudio, setIsValidatingAudio ] = useState< boolean >( false );

	const validateAudio = useCallback(
		(
			audio: Blob,
			successCallback: ( info?: ValidatedAudioInformation ) => void,
			errorCallback: ( error: string ) => void
		) => {
			setIsValidatingAudio( true );

			// Check if the audio file is too large
			if ( audio?.size > MAX_AUDIO_SIZE ) {
				setIsValidatingAudio( false );
				return errorCallback(
					__( 'The audio file is too large. The maximum file size is 25MB.', 'jetpack-ai-client' )
				);
			}

			// When it's a file, check the media type
			const isFile = audio instanceof File;
			if ( isFile ) {
				if ( ! ALLOWED_MEDIA_TYPES.includes( audio.type ) ) {
					setIsValidatingAudio( false );
					return errorCallback(
						__(
							'The audio file type is not supported. Please use a supported audio file type.',
							'jetpack-ai-client'
						)
					);
				}
			}

			// Check the duration of the audio
			const audioContext = new AudioContext();

			// Map blob to an array buffer
			audio.arrayBuffer().then( arrayBuffer => {
				// Decode audio file data contained in an ArrayBuffer
				audioContext.decodeAudioData( arrayBuffer, function ( audioBuffer ) {
					const duration = Math.ceil( audioBuffer.duration );

					if ( duration > MAX_AUDIO_DURATION ) {
						setIsValidatingAudio( false );
						return errorCallback(
							__(
								'The audio file is too long. The maximum recording time is 25 minutes.',
								'jetpack-ai-client'
							)
						);
					}
					setIsValidatingAudio( false );
					return successCallback( { duration, isFile, size: audio?.size } );
				} );
			} );
		},
		[ setIsValidatingAudio ]
	);

	return { isValidatingAudio, validateAudio };
}
