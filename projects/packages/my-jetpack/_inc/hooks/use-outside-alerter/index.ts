import { useEffect } from 'react';
import type { MutableRefObject } from 'react';

const useOutsideAlerter = (
	ref: MutableRefObject< HTMLElement >,
	onClickOutside: ( event: Event ) => void
) => {
	useEffect( () => {
		const handleClickOutside = ( event: Event ) => {
			if (
				event.target instanceof Element &&
				ref.current &&
				! ref.current.contains( event.target )
			) {
				onClickOutside( event );
			}
		};

		document.addEventListener( 'mousedown', handleClickOutside );
		return () => {
			document.removeEventListener( 'mousedown', handleClickOutside );
		};
	}, [ ref, onClickOutside ] );
};

export default useOutsideAlerter;
