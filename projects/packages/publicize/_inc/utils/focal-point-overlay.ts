import { useSyncExternalStore } from 'react';
import type { FocalPoint } from './types';

// Shared draft point so previews can follow the picker without saving on every drag.
const overlay = new Map< number, FocalPoint >();
const listeners = new Set< () => void >();

const isSamePoint = ( a: FocalPoint | undefined, b: FocalPoint ): boolean =>
	a?.x === b.x && a?.y === b.y;

const notify = () => listeners.forEach( listener => listener() );

/**
 * Sets the in-progress focal point for an attachment.
 *
 * @param {number}     attachmentId - The image's attachment id.
 * @param {FocalPoint} point        - The point to show live.
 */
export function setFocalPointOverlay( attachmentId: number, point: FocalPoint ): void {
	if ( ! attachmentId || isSamePoint( overlay.get( attachmentId ), point ) ) {
		return;
	}

	overlay.set( attachmentId, point );
	notify();
}

/**
 * Clears the in-progress focal point for an attachment.
 *
 * @param {number}     attachmentId - The image's attachment id.
 * @param {FocalPoint} point        - Optional point to match before clearing.
 */
export function clearFocalPointOverlay( attachmentId: number, point?: FocalPoint ): void {
	const current = attachmentId ? overlay.get( attachmentId ) : undefined;

	if ( ! current || ( point && ! isSamePoint( current, point ) ) ) {
		return;
	}

	overlay.delete( attachmentId );
	notify();
}

/**
 * Gets the current in-progress focal point for an attachment.
 *
 * @param {number} attachmentId - The image's attachment id.
 * @return {FocalPoint | undefined} The point to show live, or undefined.
 */
export function getFocalPointOverlay( attachmentId: number ): FocalPoint | undefined {
	return attachmentId ? overlay.get( attachmentId ) : undefined;
}

/**
 * Subscribes a listener to focal point overlay changes.
 *
 * @param {Function} listener - Called when an overlay point changes.
 * @return {Function} A function that removes the listener.
 */
function subscribe( listener: () => void ): () => void {
	listeners.add( listener );
	return () => {
		listeners.delete( listener );
	};
}

/**
 * Gets the current in-progress focal point for an attachment.
 *
 * @param {number} attachmentId - The image's attachment id.
 * @return {FocalPoint | undefined} The point to show live, or undefined.
 */
export function useFocalPointOverlay( attachmentId: number ): FocalPoint | undefined {
	const getSnapshot = () => getFocalPointOverlay( attachmentId );

	return useSyncExternalStore( subscribe, getSnapshot, getSnapshot );
}
