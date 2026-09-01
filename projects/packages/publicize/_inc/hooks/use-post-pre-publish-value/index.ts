import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Preserve a value from the post pre-publish state.
 *
 * The value will stop updating after the post is published.
 *
 * @template V
 * @param {V} value - The value to preserve.
 *
 * @return {V} The preserved value.
 */
export function usePostPrePublishValue< V >( value: V ) {
	const isPublishing = useSelect( select => select( editorStore ).isPublishingPost(), [] );

	const [ currentValue, setCurrentValue ] = useState( value );

	const valueFrozen = useRef( false );

	useEffect( () => {
		// Freeze the value after publishing starts.
		if ( isPublishing ) {
			valueFrozen.current = true;
		}

		// Since the value is not frozen yet, update the current value.
		if ( ! valueFrozen.current ) {
			setCurrentValue( value );
		}
	}, [ isPublishing, value ] );

	return currentValue;
}
