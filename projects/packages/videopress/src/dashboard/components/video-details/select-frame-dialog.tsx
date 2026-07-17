import { RangeControl, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button, Dialog } from '@wordpress/ui';
import { useEffect, useRef, useState, type ReactElement } from 'react';

// Exported for unit testing.
export const END_GUARD_SECONDS = 0.05;

/**
 * Convert a scrubbed time (seconds) to the millisecond `at_time` the poster
 * endpoint expects, clamped into [0, duration - END_GUARD_SECONDS]. The upper
 * guard mirrors the legacy behaviour: the VideoPress poster generator fails
 * when the requested frame sits too close to the end of the media.
 *
 * @param seconds         - The scrubbed time in seconds.
 * @param durationSeconds - The video's duration in seconds.
 * @return The clamped timestamp in whole milliseconds.
 */
export function frameTimeToMs( seconds: number, durationSeconds: number ): number {
	const upper = Math.max( 0, durationSeconds - END_GUARD_SECONDS );
	const clamped = Math.min( Math.max( seconds, 0 ), upper );
	return Math.round( clamped * 1000 );
}

type FrameScrubberProps = {
	src: string;
	onChange: ( ms: number ) => void;
};

/**
 * Internal component that renders a video element and a range slider
 * so the user can scrub to any frame and pick it as a thumbnail.
 *
 * @param props          - Component props.
 * @param props.src      - Source URL of the video to scrub.
 * @param props.onChange - Called with the selected timestamp in milliseconds.
 * @return The frame-scrubber element.
 */
function FrameScrubber( { src, onChange }: FrameScrubberProps ): ReactElement {
	const videoRef = useRef< HTMLVideoElement >( null );
	const [ maxDuration, setMaxDuration ] = useState< number >( 0 );
	const [ currentTime, setCurrentTime ] = useState< number | null >( null );
	const [ isLoading, setIsLoading ] = useState< boolean >( true );
	const [ hasError, setHasError ] = useState< boolean >( false );

	useEffect( () => {
		if ( videoRef.current ) {
			videoRef.current.src = src;
		}
	}, [ src ] );

	const seekTo = ( seconds: number ) => {
		setCurrentTime( seconds );
		if ( videoRef.current ) {
			videoRef.current.currentTime = seconds;
		}
	};

	const handleDurationChange = ( event: React.SyntheticEvent< HTMLVideoElement > ) => {
		const next = event.currentTarget.duration;
		if ( ! Number.isFinite( next ) ) {
			return;
		}
		setMaxDuration( next );
		// `durationchange` can fire more than once (adaptive sources update
		// duration mid-stream). Seed the midpoint only on the first run so a
		// later event doesn't snap the slider back and discard the user's pick.
		if ( currentTime === null ) {
			const initial = next / 2;
			seekTo( initial );
			onChange( frameTimeToMs( initial, next ) );
		}
	};

	const handleRangeChange = ( v: number | undefined ) => {
		if ( v === undefined ) {
			return;
		}
		seekTo( v );
		onChange( frameTimeToMs( v, maxDuration ) );
	};

	if ( hasError ) {
		return (
			<div className="vp-frame-scrubber vp-frame-scrubber__error">
				{ __( "We couldn't load this video.", 'jetpack-videopress-pkg' ) }
			</div>
		);
	}

	return (
		<div className="vp-frame-scrubber">
			{ isLoading && (
				<div className="vp-frame-scrubber__spinner">
					<Spinner />
				</div>
			) }
			<video
				ref={ videoRef }
				muted
				playsInline
				className="vp-frame-scrubber__video"
				onLoadedData={ () => setIsLoading( false ) }
				onDurationChange={ handleDurationChange }
				onError={ () => {
					setHasError( true );
					setIsLoading( false );
				} }
			/>
			<RangeControl
				className="vp-frame-scrubber__range"
				min={ 0 }
				max={ maxDuration }
				step={ 0.1 }
				value={ currentTime ?? 0 }
				onChange={ handleRangeChange }
				showTooltip={ false }
				withInputField={ false }
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
		</div>
	);
}

type Props = {
	src: string;
	isOpen: boolean;
	onClose: () => void;
	onConfirm: ( atTimeMs: number ) => void;
};

/**
 * Dialog that lets the user scrub through a video and pick a frame to use as
 * the thumbnail. Purely presentational — no data fetching or mutation inside.
 * The parent is responsible for firing the poster-update mutation via `onConfirm`.
 *
 * @param props           - Component props.
 * @param props.src       - Source URL of the video to scrub.
 * @param props.isOpen    - Whether the dialog is open.
 * @param props.onClose   - Called when the user dismisses the dialog without confirming.
 * @param props.onConfirm - Called with the selected timestamp in milliseconds when the user confirms.
 * @return The dialog element.
 */
export default function SelectFrameDialog( {
	src,
	isOpen,
	onClose,
	onConfirm,
}: Props ): ReactElement {
	const [ selectedMs, setSelectedMs ] = useState< number | null >( null );

	useEffect( () => {
		if ( ! isOpen ) {
			setSelectedMs( null );
		}
	}, [ isOpen ] );

	return (
		<Dialog.Root
			open={ isOpen }
			onOpenChange={ open => {
				if ( ! open ) {
					onClose();
				}
			} }
		>
			<Dialog.Popup size="large">
				<Dialog.Header>
					<Dialog.Title>
						{ __( 'Select thumbnail from video', 'jetpack-videopress-pkg' ) }
					</Dialog.Title>
					<Dialog.CloseIcon label={ __( 'Close', 'jetpack-videopress-pkg' ) } />
				</Dialog.Header>
				{ isOpen && <FrameScrubber src={ src } onChange={ setSelectedMs } /> }
				<Dialog.Footer>
					<Dialog.Action render={ <Button variant="outline" /> }>
						{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
					</Dialog.Action>
					<Button
						variant="solid"
						disabled={ selectedMs == null }
						onClick={ () => {
							if ( selectedMs != null ) {
								onConfirm( selectedMs );
							}
						} }
					>
						{ __( 'Select this frame', 'jetpack-videopress-pkg' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
