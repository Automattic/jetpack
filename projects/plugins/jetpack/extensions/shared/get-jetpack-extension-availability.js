/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import getJetpackData from './get-jetpack-data';

/**
 * Return whether a Jetpack Gutenberg extension is available or not.
 *
 * @param {string} name The extension's name (without the `jetpack/` prefix)
 * @returns {object} Object indicating if the extension is available (property `available`) and the reason why it is
 * unavailable (property `unavailable_reason`).
 */
export default function getJetpackExtensionAvailability( name ) {
	const data = getJetpackData();
	const available = get( data, [ 'available_blocks', name, 'available' ], false );

	const unavailableReason = get(
		data,
		[ 'available_blocks', name, 'unavailable_reason' ],
		'unknown'
	);
	const details = get( data, [ 'available_blocks', name, 'details' ], [] );

	return {
		available,
		...( ! available && { details, unavailableReason } ),
	};
}
