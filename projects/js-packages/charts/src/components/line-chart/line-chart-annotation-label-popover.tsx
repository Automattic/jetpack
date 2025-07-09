import { Gridicon } from '@automattic/jetpack-components';
import clsx from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';
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
}

const LineChartAnnotationLabelWithPopover: FC< LineChartAnnotationLabelWithPopoverProps > = ( {
	title,
	subtitle,
	renderLabel,
	renderLabelPopover,
} ) => {
	const popoverId = useId();
	const buttonRef = useRef< HTMLButtonElement >( null );
	const popoverRef = useRef< HTMLDivElement >( null );
	const [ isPositioned, setIsPositioned ] = useState( false );

	useEffect( () => {
		const button = buttonRef.current;
		const popover = popoverRef.current;

		if ( ! button || ! popover ) return;

		const positionPopover = () => {
			// Popover positioning in Safari is complicated due to issues with SVG foreign objects, so let it be positioned in the centre of the viewport.
			if ( ! isSafari ) {
				const buttonRect = button.getBoundingClientRect();
				popover.style.left = `${ buttonRect.right }px`;
				popover.style.top = `${ buttonRect.top }px`;
			}

			setIsPositioned( true );
		};

		// Position when popover shows
		popover.addEventListener( 'toggle', ( e: ToggleEvent ) => {
			if ( e.newState === 'open' ) {
				positionPopover();
			}
		} );

		// Initial positioning if already open
		try {
			if ( popover.matches( ':popover-open' ) ) {
				positionPopover();
			}
		} catch {
			// Ignore errors in test environments (e.g., JSDOM does not support :popover-open)
		}
	}, [] );

	return (
		<div className={ styles[ 'line-chart__annotation-label' ] }>
			<button
				ref={ buttonRef }
				{ ...( { popovertarget: popoverId } as ButtonWithPopover ) }
				className={ styles[ 'line-chart__annotation-label-trigger-button' ] }
				style={ {
					width: `${ POPOVER_BUTTON_SIZE }px`,
					height: `${ POPOVER_BUTTON_SIZE }px`,
					transform: `translate(${ POPOVER_BUTTON_SIZE / 2 }px, 0)`,
				} }
				aria-label="See details"
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
					isSafari && styles[ 'line-chart__annotation-label-popover--safari' ]
				) }
				data-testid="line-chart-annotation-label-popover"
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
};

export default LineChartAnnotationLabelWithPopover;
