import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { useEffect, useId, useRef, useState, version as reactVersion } from 'react';
import { isSafari } from '../../../utils';
import styles from '../line-chart.module.scss';
import type { ButtonWithPopover, PopoverElement, ToggleEvent } from '../../../types';
import type { FC, ReactNode } from 'react';

export const POPOVER_BUTTON_SIZE = 44;

// @todo Remove this (and uses of it below) when we drop support for WordPress versions shipping React 18.
const isReact18 = reactVersion.startsWith( '18.' );

const CloseIcon = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
		focusable="false"
	>
		<path d="M6 6l12 12M18 6L6 18" />
	</svg>
);

interface LineChartAnnotationLabelWithPopoverProps {
	title: string;
	subtitle?: string;
	renderLabel: ( props: { title: string; subtitle?: string } ) => ReactNode;
	renderLabelPopover: ( props: { title: string; subtitle?: string } ) => ReactNode;
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
	}, [ isBrowserSafari ] );

	return (
		<div className={ styles[ 'line-chart__annotation-label' ] }>
			<button
				ref={ buttonRef }
				{ ...( isReact18
					? ( { popovertarget: popoverId } as ButtonWithPopover )
					: { popoverTarget: popoverId } ) }
				className={ styles[ 'line-chart__annotation-label-trigger-button' ] }
				style={ {
					width: `${ POPOVER_BUTTON_SIZE }px`,
					height: `${ POPOVER_BUTTON_SIZE }px`,
					transform: `translate(${ POPOVER_BUTTON_SIZE / 2 }px, 0)`,
				} }
				aria-label={ title || __( 'View details', 'jetpack-charts' ) }
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
			>
				<Stack direction="row" align="flex-start" justify="space-between">
					<div className={ styles[ 'line-chart__annotation-label-popover-content' ] }>
						{ renderLabelPopover( { title, subtitle } ) }
					</div>
					<button
						{ ...( isReact18
							? ( {
									popovertarget: popoverId,
									popovertargetaction: 'hide',
								} as ButtonWithPopover )
							: {
									popoverTarget: popoverId,
									popoverTargetAction: 'hide',
								} ) }
						className={ styles[ 'line-chart__annotation-label-popover-close-button' ] }
						aria-label={ __( 'Close', 'jetpack-charts' ) }
					>
						<CloseIcon />
					</button>
				</Stack>
			</div>
		</div>
	);
};

export default LineChartAnnotationLabelWithPopover;
