import { useEffect, useRef } from '@wordpress/element';

export default function usePrevious( value ) {
	const ref = useRef();

	useEffect( () => {
		ref.current = value;
	}, [ value ] );

	return ref.current;
}
