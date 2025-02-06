/**
 * External dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

function animate(
	analyser: AnalyserNode,
	canvas: HTMLCanvasElement,
	pausedRef: React.MutableRefObject< boolean >
) {
	const canvasCtx = canvas.getContext( '2d' );
	const points = 10;
	let isCanceled = false;

	if ( ! canvasCtx ) {
		return;
	}

	analyser.fftSize = Math.pow( 2, 13 ); // 8192
	const bufferLength = analyser.fftSize;
	const dataArray = new Float32Array( bufferLength );
	const slice = bufferLength / points;

	const { width, height } = canvas;
	const center = height / 2;
	canvasCtx.lineWidth = 4;
	canvasCtx.lineCap = 'round';
	canvasCtx.strokeStyle =
		getComputedStyle( canvas ).getPropertyValue( '--jp-green-50' ) || '#008710';

	const draw = () => {
		canvasCtx.clearRect( 0, 0, width, height );
		analyser.getFloatTimeDomainData( dataArray );

		for ( let i = 1; i <= points; i++ ) {
			let amplitude = 0;

			if ( ! pausedRef.current ) {
				// get the average amplitude for this slice
				amplitude =
					dataArray.slice( i * slice, ( i + 1 ) * slice ).reduce( ( a, b ) => a + b, 0 ) / slice;
				// scale it
				amplitude *= 2048;
				// make it positive
				amplitude = Math.abs( amplitude );
				// ensure it is between 0 and 16
				amplitude = Math.min( 16, Math.max( 0, amplitude ) );
			}

			canvasCtx.beginPath();
			canvasCtx.moveTo( 2 + i * 6, center - amplitude );
			canvasCtx.lineTo( 2 + i * 6, center + amplitude );
			canvasCtx.stroke();
		}

		setTimeout( () => {
			if ( isCanceled ) {
				return;
			}

			requestAnimationFrame( draw );
		}, 50 ); // 20 fps
	};

	draw();

	return () => {
		isCanceled = true;
	};
}

export default function Oscilloscope( {
	analyser,
	paused = false,
}: {
	analyser: AnalyserNode;
	paused?: boolean;
} ) {
	const canvasRef = useRef( null );
	const pausedRef = useRef( paused );
	const cancelAnimation = useRef( null );

	useEffect( () => {
		pausedRef.current = paused;
	}, [ paused ] );

	useEffect( () => {
		if ( ! analyser ) {
			return;
		}

		if ( ! canvasRef.current ) {
			return;
		}

		if ( cancelAnimation.current ) {
			cancelAnimation.current();
		}

		cancelAnimation.current = animate( analyser, canvasRef.current, pausedRef );
	}, [ analyser, canvasRef, pausedRef ] );

	useEffect( () => {
		return () => {
			if ( cancelAnimation.current ) {
				cancelAnimation.current();
			}
		};
	}, [] );

	return (
		<canvas
			className="jetpack-ai-voice-to-content__oscilloscope"
			width={ 70 }
			height={ 38 }
			ref={ canvasRef }
		/>
	);
}
