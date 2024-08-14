import { Gridicon } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useState, useCallback, useRef } from 'react';
import useAnalytics from '../../../../hooks/use-analytics';
import type { FC, ReactNode } from 'react';

import './style.scss';

type Props = {
	children: ReactNode;
	icon?: string;
	iconSize?: number;
	tracksEventName?: string;
	tracksEventProps?: { [ key: string ]: string | boolean | number };
};

export const InfoTooltip: FC< Props > = ( {
	children,
	icon = 'info-outline',
	iconSize = 14,
	tracksEventName,
	tracksEventProps = {},
} ) => {
	const { recordEvent } = useAnalytics();
	const useTooltipRef = useRef< HTMLButtonElement >();
	const isMobileViewport: boolean = useViewportMatch( 'medium', '<' );
	const [ isPopoverVisible, setIsPopoverVisible ] = useState( false );

	const toggleTooltip = useCallback(
		() =>
			setIsPopoverVisible( prevState => {
				if ( ! prevState === true && tracksEventName ) {
					recordEvent( `jetpack_${ tracksEventName }`, {
						page: 'my-jetpack',
						feature: 'jetpack-protect',
						...tracksEventProps,
					} );
				}
				return ! prevState;
			} ),
		[ recordEvent, tracksEventName, tracksEventProps ]
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
				<Gridicon icon={ icon } size={ iconSize } />
			</button>
			{ isPopoverVisible && (
				<Popover
					placement={ isMobileViewport ? 'top-end' : 'right' }
					noArrow={ false }
					offset={ 10 }
					focusOnMount={ 'container' }
					onClose={ hideTooltip }
				>
					<div className="info-tooltip__content">{ children }</div>
				</Popover>
			) }
		</span>
	);
};
