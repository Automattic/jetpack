import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Carry the deprecated customThankyou attribute over to its replacements.
 *
 * Forms saved before `confirmationType` and `disableSummary` existed only carry
 * `customThankyou`, so the two newer attributes have to be derived from it.
 *
 * @param {object}   params               - Hook parameters.
 * @param {object}   params.attributes    - Block attributes.
 * @param {Function} params.setAttributes - Setter for block attributes.
 */
export default function useDeprecatedThankYouMigration( { attributes, setAttributes } ) {
	const { customThankyou, confirmationType, disableSummary } = attributes || {};
	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch( blockEditorStore );

	useEffect( () => {
		const migrated = {};

		if ( customThankyou === 'redirect' && confirmationType !== 'redirect' ) {
			migrated.confirmationType = 'redirect';
		}

		if ( [ 'noSummary', 'message' ].includes( customThankyou ) && ! disableSummary ) {
			migrated.disableSummary = true;
		}

		if ( ! Object.keys( migrated ).length ) {
			return;
		}

		// Migrating an old attribute is not a user edit, so it must not mark the
		// post, template, or template part holding the form as having changes.
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( migrated );
	}, [
		confirmationType,
		customThankyou,
		disableSummary,
		setAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );
}
