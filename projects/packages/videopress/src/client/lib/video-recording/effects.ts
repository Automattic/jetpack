import { __ } from '@wordpress/i18n';

type ColorOperation = {
	type: 'saturate' | 'contrast' | 'brightness' | 'sepia' | 'grayscale' | 'hue-rotate';
	value: number;
};

export const RECORDING_EFFECTS = [
	{ id: 'original', label: __( 'Original', 'jetpack-videopress-pkg' ), operations: [] },
	{
		id: 'vivid',
		label: __( 'Vivid', 'jetpack-videopress-pkg' ),
		operations: [
			{ type: 'saturate', value: 1.5 },
			{ type: 'contrast', value: 1.15 },
		],
	},
	{
		id: 'warm',
		label: __( 'Warm', 'jetpack-videopress-pkg' ),
		operations: [
			{ type: 'sepia', value: 0.3 },
			{ type: 'saturate', value: 1.2 },
			{ type: 'brightness', value: 1.06 },
		],
	},
	{
		id: 'cool',
		label: __( 'Cool', 'jetpack-videopress-pkg' ),
		operations: [
			{ type: 'sepia', value: 0.2 },
			{ type: 'hue-rotate', value: 170 },
			{ type: 'saturate', value: 1.15 },
		],
	},
	{
		id: 'mono',
		label: __( 'Mono', 'jetpack-videopress-pkg' ),
		operations: [ { type: 'grayscale', value: 1 } ],
	},
	{
		id: 'vintage',
		label: __( 'Vintage', 'jetpack-videopress-pkg' ),
		operations: [
			{ type: 'sepia', value: 0.6 },
			{ type: 'contrast', value: 0.9 },
			{ type: 'brightness', value: 1.05 },
			{ type: 'saturate', value: 0.8 },
		],
	},
] as const satisfies readonly {
	id: string;
	label: string;
	operations: readonly ColorOperation[];
}[];

export type RecordingEffect = ( typeof RECORDING_EFFECTS )[ number ][ 'id' ];
const IDENTITY = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0 ];

/**
 * Convert a CSS color operation to an RGB matrix for browsers without canvas filters.
 *
 * @param operation       - Preset operation.
 * @param operation.type  - CSS color operation.
 * @param operation.value - Operation amount.
 * @return Three rows of RGB coefficients and offsets in byte units.
 */
function operationMatrix( { type, value }: ColorOperation ): number[] {
	if ( type === 'brightness' || type === 'contrast' ) {
		const offset = type === 'contrast' ? 127.5 * ( 1 - value ) : 0;
		return [ value, 0, 0, offset, 0, value, 0, offset, 0, 0, value, offset ];
	}
	if ( type === 'sepia' ) {
		const sepia = [ 0.393, 0.769, 0.189, 0, 0.349, 0.686, 0.168, 0, 0.272, 0.534, 0.131, 0 ];
		return sepia.map( ( entry, index ) => IDENTITY[ index ] * ( 1 - value ) + entry * value );
	}
	if ( type === 'hue-rotate' ) {
		const cos = Math.cos( ( value * Math.PI ) / 180 );
		const sin = Math.sin( ( value * Math.PI ) / 180 );
		return [
			0.213 + cos * 0.787 - sin * 0.213,
			0.715 - cos * 0.715 - sin * 0.715,
			0.072 - cos * 0.072 + sin * 0.928,
			0,
			0.213 - cos * 0.213 + sin * 0.143,
			0.715 + cos * 0.285 + sin * 0.14,
			0.072 - cos * 0.072 - sin * 0.283,
			0,
			0.213 - cos * 0.213 - sin * 0.787,
			0.715 - cos * 0.715 + sin * 0.715,
			0.072 + cos * 0.928 + sin * 0.072,
			0,
		];
	}
	const saturation = type === 'grayscale' ? 1 - value : value;
	const weights = type === 'grayscale' ? [ 0.2126, 0.7152, 0.0722 ] : [ 0.213, 0.715, 0.072 ];
	return IDENTITY.map( ( entry, index ) =>
		index % 4 === 3 ? 0 : weights[ index % 4 ] * ( 1 - saturation ) + entry * saturation
	);
}

/**
 * Resolve the same preset filter used for the live view and encoded frames.
 *
 * @param effect - Selected preset.
 * @return CSS filter value.
 */
export function getRecordingFilter( effect: RecordingEffect ): string {
	const preset = RECORDING_EFFECTS.find( candidate => candidate.id === effect )!;
	return (
		preset.operations
			.map( ( { type, value } ) => `${ type }(${ value }${ type === 'hue-rotate' ? 'deg' : '' })` )
			.join( ' ' ) || 'none'
	);
}

/**
 * Paint the chosen effect into the captured frame, including a canvas-filter fallback.
 *
 * @param context - Output canvas context.
 * @param video   - Untouched camera element; CSS mirroring affects only the monitor.
 * @param effect  - Selected preset.
 */
export function drawRecordingFrame(
	context: CanvasRenderingContext2D,
	video: HTMLVideoElement,
	effect: RecordingEffect
): void {
	const { width, height } = context.canvas;
	if ( typeof context.filter === 'string' ) {
		context.filter = getRecordingFilter( effect );
		context.drawImage( video, 0, 0, width, height );
		return;
	}
	context.drawImage( video, 0, 0, width, height );
	if ( effect === 'original' ) {
		return;
	}
	const image = context.getImageData( 0, 0, width, height );
	const { operations } = RECORDING_EFFECTS.find( candidate => candidate.id === effect )!;
	for ( const operation of operations ) {
		const m = operationMatrix( operation );
		for ( let i = 0; i < image.data.length; i += 4 ) {
			const r = image.data[ i ];
			const g = image.data[ i + 1 ];
			const b = image.data[ i + 2 ];
			image.data[ i ] = r * m[ 0 ] + g * m[ 1 ] + b * m[ 2 ] + m[ 3 ];
			image.data[ i + 1 ] = r * m[ 4 ] + g * m[ 5 ] + b * m[ 6 ] + m[ 7 ];
			image.data[ i + 2 ] = r * m[ 8 ] + g * m[ 9 ] + b * m[ 10 ] + m[ 11 ];
		}
	}
	context.putImageData( image, 0, 0 );
}
