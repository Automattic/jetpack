import { StoryFn, Meta } from '@storybook/react';
import { scaleBand, scaleLinear } from '@visx/scale';
import GridControl from '../grid-control';

// Define metadata for the story
export default {
	title: 'JS Packages/Charts/GridControl',
	component: GridControl,
	argTypes: {
		gridVisibility: {
			control: { type: 'select' },
			options: [ 'x', 'y', 'xy', 'none' ],
		},
	},
} as Meta< typeof GridControl >;

// Create a template for the stories
const Template: StoryFn< typeof GridControl > = args => {
	const xScale = scaleBand( { domain: [ 'A', 'B', 'C' ], range: [ 0, 100 ] } );
	const yScale = scaleLinear( { domain: [ 0, 100 ], range: [ 100, 0 ] } );

	return (
		<svg width={ 200 } height={ 200 }>
			<GridControl
				{ ...args }
				width={ 200 }
				height={ 200 }
				xScale={ xScale }
				yScale={ yScale }
				showGridX={ args.gridVisibility === 'x' || args.gridVisibility === 'xy' }
				showGridY={ args.gridVisibility === 'y' || args.gridVisibility === 'xy' }
			/>
		</svg>
	);
};

// Define stories for each grid visibility option
export const XGrid = Template.bind( {} );
XGrid.args = { gridVisibility: 'x' };

export const YGrid = Template.bind( {} );
YGrid.args = { gridVisibility: 'y' };

export const XYGrid = Template.bind( {} );
XYGrid.args = { gridVisibility: 'xy' };

export const NoGrid = Template.bind( {} );
NoGrid.args = { gridVisibility: 'none' };
