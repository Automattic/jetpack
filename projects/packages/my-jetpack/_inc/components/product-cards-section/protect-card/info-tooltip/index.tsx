import { Gridicon } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useState, useCallback, useRef } from 'react';
import type { FC, ReactNode } from 'react';

import './style.scss';

export const InfoTooltip: FC< { children: ReactNode } > = ( { children } ) => {
	const useTooltipRef = useRef< HTMLButtonElement >();
	const isMobileViewport: boolean = useViewportMatch( 'medium', '<' );
	const [ isPopoverVisible, setIsPopoverVisible ] = useState( false );

	const toggleTooltip = useCallback(
		() => setIsPopoverVisible( prevState => ! prevState ),
		[ setIsPopoverVisible ]
	);
	const hideTooltip = useCallback( () => {
		// Don't hide the tooltip here if it's the tooltip button that was clicked (the button
		// becoming the document's activeElement). Instead let toggleTooltip() handle the closing.
		if ( useTooltipRef.current && ! useTooltipRef.current.contains( document.activeElement ) ) {
			setIsPopoverVisible( false );
		}
	}, [ setIsPopoverVisible, useTooltipRef ] );

	return (
		<span>
			<button className="info-tooltip__button" onClick={ toggleTooltip } ref={ useTooltipRef }>
				<Gridicon icon="info-outline" size={ 14 } />
			</button>
			{ isPopoverVisible && (
				<Popover
					placement={ isMobileViewport ? 'top-end' : 'right' }
					noArrow={ false }
					offset={ 10 }
					focusOnMount={ 'container' }
					onClose={ hideTooltip }
				>
					{ children }
				</Popover>
			) }
		</span>
	);
};
