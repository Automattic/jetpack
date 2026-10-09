import { useEffect, useRef } from '@wordpress/element';
import { isEqual } from 'lodash';

const hasCoordinates = points =>
	points?.length > 0 &&
	points.every(
		point =>
			Number.isFinite( point?.coordinates?.latitude ) &&
			Math.abs( point.coordinates.latitude ) <= 90 &&
			Number.isFinite( point.coordinates.longitude ) &&
			Math.abs( point.coordinates.longitude ) <= 180
	);

/**
 * Resolve new addresses without rewriting saved or explicitly edited locations.
 *
 * @param {string}        address   Address to resolve.
 * @param {Array}         points    Current map locations.
 * @param {Function|null} lookup    Async lookup, or null until the provider is ready.
 * @param {Function}      onSuccess Receives the resolved points.
 * @param {Function}      onError   Receives lookup failures.
 */
export default function useAddressLookup( address, points, lookup, onSuccess, onError ) {
	const previous = useRef( { address, points, resolved: hasCoordinates( points ) } );
	const callbacks = useRef( { onSuccess, onError } );
	callbacks.current = { onSuccess, onError };

	useEffect( () => {
		const state = previous.current;
		if ( address !== state.address ) {
			// A tool can supply the new address and its coordinates together.
			state.resolved = ! isEqual( points, state.points ) && hasCoordinates( points );
		} else if ( ! isEqual( points, state.points ) && hasCoordinates( points ) ) {
			state.resolved = true;
		}
		state.address = address;
		state.points = points;

		if ( ! address?.length || ! lookup || state.resolved ) {
			return;
		}

		let cancelled = false;
		lookup( address ).then(
			result => {
				if ( ! cancelled && hasCoordinates( result ) ) {
					state.resolved = true;
					callbacks.current.onSuccess( result );
				}
			},
			error => {
				if ( ! cancelled ) {
					callbacks.current.onError?.( error );
				}
			}
		);
		// Discard, navigation, and newer edits must invalidate pending results.
		return () => {
			cancelled = true;
		};
	}, [ address, points, lookup ] );
}
