import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
	viewsByCountry,
	themeArgTypes,
} from '../../../stories';
import GeoChart from '../geo-chart';
import type { Meta } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof GeoChart > >;

export const geoChartMetaArgs: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Geo Chart',
	component: GeoChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [ chartDecorator ],
	argTypes: {
		...sharedChartArgTypes,
		...themeArgTypes,
	},
};

export const geoChartStoryArgs = {
	data: viewsByCountry,
	withPadding: false,
};
