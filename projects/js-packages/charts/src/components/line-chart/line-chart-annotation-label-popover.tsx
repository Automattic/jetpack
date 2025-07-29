import clsx from 'clsx';
import Gridicon from 'gridicons';
import { useEffect, useId, useRef, useState, forwardRef } from 'react';
import { isSafari } from '../shared/utils';
import styles from './line-chart.module.scss';
import type { ButtonWithPopover, PopoverElement, ToggleEvent } from '../../types';
import type { FC } from 'react';

export const POPOVER_BUTTON_SIZE = 44;

interface LineChartAnnotationLabelWithPopoverProps {
	title: string;
	subtitle?: string;
	renderLabel: FC< { title: string; subtitle?: string } >;
	renderLabelPopover: FC< { title: string; subtitle?: string } >;
	tabIndex?: number;
	'aria-label'?: string;
	'aria-describedby'?: string;
}

const LineChartAnnotationLabelWithPopover = forwardRef<
	HTMLButtonElement,
	LineChartAnnotationLabelWithPopoverProps
>(
	(
		{
			title,
			subtitle,
			renderLabel,
			renderLabelPopover,
			tabIndex,
			'aria-label': ariaLabel,
			'aria-describedby': ariaDescribedBy,
		},
		ref
	) => {
		const popoverId = useId();
		const buttonRef = useRef< HTMLButtonElement >( null );
		const popoverRef = useRef< HTMLDivElement >( null );
		const [ isPositioned, setIsPositioned ] = useState( false );
		const isBrowserSafari = isSafari();

		useEffect( () => {
			const button = buttonRef.current;
			const popover = popoverRef.current;

			if ( ! button || ! popover ) return;

			const positionPopover = () => {
				// Popover positioning in Safari is complicated due to issues with SVG foreign objects (https://bugs.webkit.org/show_bug.cgi?id=23113), so let it be positioned in the centre of the viewport.
				if ( ! isBrowserSafari ) {
					const buttonRect = button.getBoundingClientRect();
					popover.style.left = `${ buttonRect.right }px`;
					popover.style.top = `${ buttonRect.top }px`;
				}

				setIsPositioned( true );
			};

			const handleToggle = ( e: ToggleEvent ) => {
				if ( e.newState === 'open' ) {
					positionPopover();

					// Focus the popover content for screen readers
					// Use a small delay to ensure the popover is fully rendered
					setTimeout( () => {
						const focusableElement = popover.querySelector(
							'button, [tabindex="0"], [tabindex="-1"]'
						) as HTMLElement;
						if ( focusableElement ) {
							focusableElement.focus();
						} else {
							// Fallback: focus the popover itself
							popover.focus();
						}
					}, 10 );
				}
			};

			// Position when popover shows
			popover.addEventListener( 'toggle', handleToggle );

			// Initial positioning if already open
			try {
				if ( popover.matches( ':popover-open' ) ) {
					positionPopover();
				}
			} catch {
				// Ignore errors in test environments (e.g., JSDOM does not support :popover-open)
			}

			return () => {
				popover.removeEventListener( 'toggle', handleToggle );
			};
		}, [ isBrowserSafari ] );

		return (
			<div className={ styles[ 'line-chart__annotation-label' ] }>
				<button
					ref={ ref || buttonRef }
					{ ...( { popovertarget: popoverId } as ButtonWithPopover ) }
					className={ styles[ 'line-chart__annotation-label-trigger-button' ] }
					style={ {
						width: `${ POPOVER_BUTTON_SIZE }px`,
						height: `${ POPOVER_BUTTON_SIZE }px`,
						transform: `translate(${ POPOVER_BUTTON_SIZE / 2 }px, 0)`,
					} }
					aria-label={ ariaLabel || title || 'View details' }
					aria-describedby={ ariaDescribedBy }
					tabIndex={ tabIndex }
				>
					{ renderLabel( { title, subtitle } ) }
				</button>
				<div
					ref={ popoverRef }
					id={ popoverId }
					{ ...( { popover: 'auto' } as PopoverElement ) }
					className={ clsx(
						styles[ 'line-chart__annotation-label-popover' ],
						isPositioned && styles[ 'line-chart__annotation-label-popover--visible' ],
						isBrowserSafari && styles[ 'line-chart__annotation-label-popover--safari' ]
					) }
					data-testid="line-chart-annotation-label-popover"
					role="dialog"
					aria-modal="true"
					tabIndex={ -1 }
				>
					<div className={ styles[ 'line-chart__annotation-label-popover-header' ] }>
						<div className={ styles[ 'line-chart__annotation-label-popover-content' ] }>
							{ renderLabelPopover( { title, subtitle } ) }
						</div>
						<button
							{ ...( {
								popovertarget: popoverId,
								popovertargetaction: 'hide',
							} as ButtonWithPopover ) }
							className={ styles[ 'line-chart__annotation-label-popover-close-button' ] }
							aria-label="Close"
						>
							<Gridicon icon="cross" size={ 16 } />
						</button>
					</div>
				</div>
			</div>
		);
	}
);

LineChartAnnotationLabelWithPopover.displayName = 'LineChartAnnotationLabelWithPopover';

export default LineChartAnnotationLabelWithPopover;
