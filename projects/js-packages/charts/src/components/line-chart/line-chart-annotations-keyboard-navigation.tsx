import { useRef, useState } from 'react';
import { useAnnotationKeyboardNavigation } from './use-annotation-keyboard-navigation';
import type { FC, ReactNode } from 'react';

interface LineChartAnnotationsKeyboardNavigationProps {
	children: ReactNode;
	chartWidth: number;
	chartHeight: number;
	totalInteractiveAnnotations: number;
	selectedIndex: number | undefined;
	setSelectedIndex: ( index: number | undefined ) => void;
}

const LineChartAnnotationsKeyboardNavigation: FC<
	LineChartAnnotationsKeyboardNavigationProps
> = ( {
	children,
	chartWidth,
	chartHeight,
	totalInteractiveAnnotations,
	selectedIndex,
	setSelectedIndex,
} ) => {
	const overlayRef = useRef< HTMLDivElement >( null );
	const [ isNavigating, setIsNavigating ] = useState( false );

	// Handle annotation activation (open popover)
	const handleActivateAnnotation = () => {
		// Activation will be handled by the annotation component itself
		// when it receives the isSelected prop
	};

	// Set up keyboard navigation
	const { onOverlayFocus, onOverlayBlur, onOverlayKeyDown } = useAnnotationKeyboardNavigation( {
		selectedIndex,
		setSelectedIndex,
		isNavigating,
		setIsNavigating,
		overlayRef,
		totalInteractiveAnnotations,
		onActivateAnnotation: handleActivateAnnotation,
	} );

	return (
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
		<div
			ref={ overlayRef }
			role="application"
			aria-label="Chart annotations. Use arrow keys to navigate."
			tabIndex={ 0 }
			onFocus={ onOverlayFocus }
			onBlur={ onOverlayBlur }
			onKeyDown={ onOverlayKeyDown }
			style={ { width: chartWidth, height: chartHeight } }
		>
			{ children }
		</div>
	);
};

export default LineChartAnnotationsKeyboardNavigation;
