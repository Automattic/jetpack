import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { nanoid } from 'nanoid';

export default function useFieldId( setAttributes, attributes ) {
	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch( 'core/block-editor' );
	useEffect( () => {
		if ( ! attributes.id ) {
			// Ensure this change doesn't result in an entry on the undo stack.
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				id: nanoid( 10 ),
			} );
		}
	}, [ attributes.id, setAttributes, __unstableMarkNextChangeAsNotPersistent ] );
}
