/**
 * Why the recording workspace can't use the camera, as something the person can act on.
 */
export type CameraProblem =
	| 'unsupported'
	| 'insecure'
	| 'blocked'
	| 'blocked-by-system'
	| 'missing-camera'
	| 'missing-microphone'
	| 'missing-devices'
	| 'in-use'
	| 'recording-failed'
	| 'unknown';

/**
 * Explain why recording can't start before asking for the camera.
 *
 * @param win - Browser window.
 * @return The problem, or null when the browser can ask for a camera.
 */
export function getEnvironmentProblem( win: Window = window ): CameraProblem | null {
	if ( win.isSecureContext === false ) {
		return 'insecure';
	}
	if ( ! win.navigator.mediaDevices?.getUserMedia ) {
		return 'unsupported';
	}
	return null;
}

/**
 * Map a getUserMedia rejection to the step that fixes it.
 *
 * @param error - Rejection from getUserMedia.
 * @return The problem.
 */
export function getCameraProblem( error: unknown ): CameraProblem {
	const { name = '', message = '' } = ( error ?? {} ) as { name?: string; message?: string };
	switch ( name ) {
		case 'NotAllowedError':
		case 'PermissionDeniedError':
			// Chrome reports an operating-system block with the same name as a site block.
			return /system/i.test( message ) ? 'blocked-by-system' : 'blocked';
		case 'SecurityError':
			return 'blocked';
		case 'NotFoundError':
		case 'DevicesNotFoundError':
		case 'OverconstrainedError':
		case 'ConstraintNotSatisfiedError':
			return 'missing-devices';
		case 'NotReadableError':
		case 'TrackStartError':
		case 'AbortError':
			return 'in-use';
		default:
			return 'unknown';
	}
}

/**
 * Narrow a missing-device problem to the device that is actually missing.
 *
 * @param devices - Media devices API.
 * @return Which input is missing; both when it can't tell.
 */
export async function findMissingDevice(
	devices: MediaDevices | undefined = navigator.mediaDevices
): Promise< CameraProblem > {
	try {
		const inputs = await devices!.enumerateDevices();
		const camera = inputs.some( device => device.kind === 'videoinput' );
		const microphone = inputs.some( device => device.kind === 'audioinput' );
		if ( camera && ! microphone ) {
			return 'missing-microphone';
		}
		if ( microphone && ! camera ) {
			return 'missing-camera';
		}
	} catch {
		// Fall through to the combined message.
	}
	return 'missing-devices';
}

/**
 * Call back once the person unblocks the camera and microphone in the browser's site settings.
 *
 * @param onAllowed - Called once, when no input is denied any more.
 * @return Stop watching.
 */
export function watchCameraPermission( onAllowed: () => void ): () => void {
	let stopped = false;
	const statuses: PermissionStatus[] = [];
	const check = () => {
		if ( ! stopped && statuses.every( status => status.state !== 'denied' ) ) {
			stop();
			onAllowed();
		}
	};
	const stop = () => {
		stopped = true;
		statuses.forEach( status => status.removeEventListener( 'change', check ) );
	};
	const query = navigator.permissions?.query?.bind( navigator.permissions );
	if ( query ) {
		Promise.all(
			[ 'camera', 'microphone' ].map( name => query( { name: name as PermissionName } ) )
		).then(
			results => {
				if ( stopped ) {
					return;
				}
				statuses.push( ...results );
				results.forEach( status => status.addEventListener( 'change', check ) );
			},
			() => {
				// Browsers that can't query these permissions leave retrying to the person.
			}
		);
	}
	return stop;
}
