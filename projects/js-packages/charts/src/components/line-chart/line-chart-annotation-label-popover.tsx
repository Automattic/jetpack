import { Gridicon } from '@automattic/jetpack-components';
import { useEffect, useId, useRef, useState } from 'react';
import type { FC } from 'react';

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
			const buttonRect = button.getBoundingClientRect();
			popover.style.left = `${ buttonRect.right + 10 }px`;
			popover.style.top = `${ buttonRect.top }px`;
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
		<div
			style={ {
				pointerEvents: 'auto',
			} }
		>
			<button
				ref={ buttonRef }
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				{ ...( { popovertarget: popoverId } as any ) }
				style={ {
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					pointerEvents: 'auto',
					cursor: 'pointer',
					border: 'none',
					width: '44px',
					height: '44px',
					background: 'none',
					padding: 0,
					transform: 'translate(22px, 0)',
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
				style={
					{
						minWidth: '125px',
						borderRadius: '2px',
						padding: '4px',
						background: 'white',
						boxShadow: '0 2px 5px 0 rgba(0, 0, 0, 0.1)',
						border: 'none',
						position: 'fixed',
						visibility: isPositioned ? 'visible' : 'hidden',
						margin: 0,
					} as React.CSSProperties
				}
			>
				<div
					style={ {
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'start',
						marginBottom: '8px',
					} }
				>
					<div style={ { padding: '10px' } }>{ renderLabelPopover( { title, subtitle } ) }</div>
					<button
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						{ ...( { popovertarget: popoverId, popovertargetaction: 'hide' } as any ) }
						style={ {
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							fontSize: '16px',
							width: '44px',
							height: '44px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							padding: '0',
						} }
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
