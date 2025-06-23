import React from 'react';
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
