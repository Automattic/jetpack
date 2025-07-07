import { Gridicon } from '@automattic/jetpack-components';
import clsx from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';
import { isSafari } from '../shared/utils';
import styles from './line-chart.module.scss';
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
		popover.addEventListener( 'toggle', e => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if ( ( e as any ).newState === 'open' ) {
				positionPopover();
			}
		} );

		// Initial positioning if already open
		if ( popover.matches( ':popover-open' ) ) {
			positionPopover();
		}
	}, [] );

	return (
		<div className={ styles[ 'line-chart__annotation-label' ] }>
			<button
				ref={ buttonRef }
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				{ ...( { popovertarget: popoverId } as any ) }
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
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				{ ...( { popover: 'auto' } as any ) }
				className={ clsx(
					styles[ 'line-chart__annotation-label-popover' ],
					! isPositioned && styles[ 'line-chart__annotation-label-popover--hidden' ],
					isSafari && styles[ 'line-chart__annotation-label-popover--safari' ]
				) }
			>
				<div className={ styles[ 'line-chart__annotation-label-popover-header' ] }>
					<div className={ styles[ 'line-chart__annotation-label-popover-content' ] }>
						{ renderLabelPopover( { title, subtitle } ) }
					</div>
					<button
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						{ ...( { popovertarget: popoverId, popovertargetaction: 'hide' } as any ) }
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
