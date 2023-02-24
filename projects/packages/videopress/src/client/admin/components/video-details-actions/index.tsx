/**
 * External dependencies
 */
import { Button } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { useState } from 'react';

const VideoDetailsActions = ( { disabled = false }: { disabled?: boolean } ) => {
	const [ anchor, setAnchor ] = useState( null );
	const [ showPopover, setShowPopover ] = useState( false );

	const popoverProps: Omit< Popover.Props, 'children' > & { offset: number } = {
		noArrow: true,
		position: 'bottom center',
		focusOnMount: false,
		anchorRect: anchor?.getBoundingClientRect(),
		offset: 8,
	};

	return (
		<div ref={ setAnchor }>
			<Button
				variant="tertiary"
				disabled={ disabled }
				icon={ moreVertical }
				onClick={ () => {
					setShowPopover( prevState => ! prevState );
				} }
			/>
			{ anchor && showPopover && <Popover { ...popoverProps }>{ /* Contents */ }</Popover> }
		</div>
	);
};

export default VideoDetailsActions;
