import { StoryFn, Meta } from '@storybook/react';
import { scaleBand, scaleLinear } from '@visx/scale';
import GridControl from '../grid-control';

// Define metadata for the story
export default {
	title: 'JS Packages/Charts/Composites/GridControl',
	component: GridControl,
	argTypes: {
		gridVisibility: {
			control: { type: 'select' },
			options: [ 'x', 'y', 'xy', 'none' ],
		},
		className: {
			control: { type: 'text' },
			description: 'Custom CSS class for styling grid lines',
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
				className={ args.className }
			/>
		</svg>
	);
};

// Define stories for each grid visibility option
export const Default = Template.bind( {} );
Default.args = {
	gridVisibility: 'xy',
	className: 'grid-lines',
};
