import React, { useId, useRef, useEffect, useState } from 'react';
import LineChart from '../line-chart';
import { lineChartMetaArgs, lineChartStoryArgs } from './config';
import sampleData from './sample-data';
import type { LineChartAnnotationProps } from '../line-chart-annotation';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

const meta: Meta< typeof LineChart > = {
	...lineChartMetaArgs,
	title: 'JS Packages/Charts/Types/Line Chart/Annotations',
} satisfies Meta< typeof LineChart >;

export default meta;

const Template: StoryFn< typeof LineChart > = args => <LineChart { ...args } />;

const annotations: LineChartAnnotationProps[] = [
	{
		datum: sampleData[ 0 ].data[ 10 ],
		title: 'Notable event',
		subtitle: 'This is a notable event',
	},
	{
		datum: sampleData[ 1 ].data[ sampleData[ 1 ].data.length - 10 ],
		title: 'Another notable event',
		subtitle: 'This is another notable event',
	},
	{
		datum: sampleData[ 2 ].data[ sampleData[ 2 ].data.length - 51 ],
		title: 'Concerning event',
		subtitle: 'This is a concerning event',
		styles: {
			circleSubject: {
				fill: 'var(--jp-red)',
			},
			label: {
				anchorLineStroke: 'var(--jp-red)',
			},
			connector: {
				stroke: 'var(--jp-red)',
			},
		},
	},
];

const annotationStoryArgs = {
	...lineChartStoryArgs,
	showLegend: true,
	annotations: [ ...annotations ],
};

export const Default: StoryObj< typeof LineChart > = Template.bind( {} );
Default.args = {
	...annotationStoryArgs,
};

export const Vertical: StoryObj< typeof LineChart > = Template.bind( {} );
Vertical.args = {
	...annotationStoryArgs,
	annotations: annotations.map( annotation => ( {
		...annotation,
		subjectType: 'line-vertical',
	} ) ),
};

export const Horizontal: StoryObj< typeof LineChart > = Template.bind( {} );
Horizontal.args = {
	...annotationStoryArgs,
	annotations: annotations.map( annotation => ( {
		...annotation,
		subjectType: 'line-horizontal',
	} ) ),
};

export const Mixed: StoryObj< typeof LineChart > = Template.bind( {} );
Mixed.args = {
	...annotationStoryArgs,
	annotations: annotations.map( ( annotation, index ) => {
		let subjectType;
		if ( index === 0 ) {
			subjectType = 'circle';
		} else if ( index === 1 ) {
			subjectType = 'line-vertical';
		} else {
			subjectType = 'line-horizontal';
		}
		return {
			...annotation,
			subjectType,
		};
	} ),
};

export const Colored: StoryObj< typeof LineChart > = Template.bind( {} );
Colored.args = {
	...annotationStoryArgs,
	annotations: [
		{
			...annotations[ 0 ],
			styles: {
				label: {
					backgroundFill: '#98C8DF',
					showAnchorLine: false,
				},
				circleSubject: {
					fill: '#98C8DF',
				},
				connector: {
					stroke: '#98C8DF',
				},
			},
		},
		{
			...annotations[ 1 ],
			styles: {
				label: {
					backgroundFill: '#006DAB',
					fontColor: '#fff',
					showAnchorLine: false,
				},
				circleSubject: {
					fill: '#006DAB',
				},
				connector: {
					stroke: '#006DAB',
				},
			},
		},
		{
			...annotations[ 2 ],
			styles: {
				label: {
					backgroundFill: 'var(--jp-red)',
					showAnchorLine: false,
					fontColor: '#fff',
				},
				circleSubject: {
					fill: 'var(--jp-red)',
				},
				connector: {
					stroke: 'var(--jp-red)',
				},
			},
		},
	],
};

const CustomLabel = ( { title, subtitle }: { title: string; subtitle: string } ) => {
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
				transform: 'translate(15px, 0)',
			} }
		>
			<button
				ref={ buttonRef }
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				{ ...( { popoverTarget: popoverId } as any ) }
				style={ {
					pointerEvents: 'auto',
					cursor: 'pointer',
					background: 'black',
					border: 'none',
					borderRadius: '50%',
					color: 'white',
					width: '30px',
					height: '30px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				} }
			>
				D
			</button>
			<div
				ref={ popoverRef }
				id={ popoverId }
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				{ ...( { popover: 'auto' } as any ) }
				style={
					{
						width: '125px',
						borderRadius: '2px',
						padding: '10px',
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
						gap: '10px',
						marginBottom: '8px',
					} }
				>
					<h4 style={ { margin: 0 } }>{ title }</h4>
					<button
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						{ ...( { popoverTarget: popoverId, popoverTargetAction: 'hide' } as any ) }
						style={ {
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							fontSize: '16px',
							width: '24px',
							height: '24px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						} }
					>
						×
					</button>
				</div>
				<p style={ { margin: 0 } }>{ subtitle }</p>
			</div>
		</div>
	);
};

const customAnnotationArgs = {
	subjectType: 'line-vertical',
	styles: {
		label: { showAnchorLine: false, y: 'start' },
	},
	renderLabel: ( { title, subtitle }: { title: string; subtitle: string } ) => (
		<CustomLabel title={ title } subtitle={ subtitle } />
	),
};

export const CustomVertical: StoryObj< typeof LineChart > = Template.bind( {} );
CustomVertical.args = {
	...annotationStoryArgs,
	annotations: annotations.map( annotation => ( {
		...annotation,
		...customAnnotationArgs,
	} ) ),
};
