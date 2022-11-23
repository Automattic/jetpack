/**
 * External dependencies
 */
import { useEffect, useState } from 'react';

export const useActionItem = () => {
	const [ anchor, setAnchor ] = useState( null );
	const [ showPopover, setShowPopover ] = useState( false );
	const [ isHovering, setIsHovering ] = useState( false );
	const [ isFocused, setIsFocused ] = useState( false );

	useEffect( () => {
		if ( isHovering || isFocused ) {
			setShowPopover( true );
		} else {
			setShowPopover( false );
		}
	}, [ isHovering, isFocused ] );

	return {
		setAnchor,
		setIsFocused,
		setIsHovering,
		setShowPopover,
		anchor,
		isFocused,
		isHovering,
		showPopover,
	};
};
