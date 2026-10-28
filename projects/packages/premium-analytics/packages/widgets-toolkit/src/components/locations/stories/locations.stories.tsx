/**
 * External dependencies
 */
import { location } from '@jetpack-premium-analytics/icons';
/**
 * Internal dependencies
 */
import { WidgetCard } from '../../../stories/widget-card';
import { withWidgetRoot } from '../../../stories/with-widget-root';
import { Locations } from '../locations';
import type { LocationRowInput } from '../build-locations-data';
import type { Decorator, Meta, StoryObj } from '@storybook/react';

const COUNTRIES: LocationRowInput[] = [
	{ id: 'us', label: 'United States', value: 12400, previousValue: 11000 },
	{ id: 'gb', label: 'United Kingdom', value: 3100, previousValue: 3600 },
	{ id: 'ca', label: 'Canada', value: 2050, previousValue: 1900 },
	{ id: 'de', label: 'Germany', value: 980, previousValue: 1200 },
	{ id: 'au', label: 'Australia', value: 640, previousValue: 500 },
];

const STATES: LocationRowInput[] = [
	{ id: 'California', label: 'California', value: 4200, previousValue: 3900 },
	{ id: 'Texas', label: 'Texas', value: 2650, previousValue: 2800 },
	{ id: 'New York', label: 'New York', value: 2100, previousValue: 1700 },
	{ id: 'Florida', label: 'Florida', value: 1300, previousValue: 1250 },
];

const READY = { isLoading: false, isError: false };

const withCard: Decorator = Story => (
	<WidgetCard height="360px" width="800px">
		<Story />
	</WidgetCard>
);

const meta: Meta< typeof Locations > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/Locations',
	component: Locations,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The locations widget body: hand it the ranking, as countries or as the regions of one country, and the request status, and it renders the list with a flag, share and delta per location beside the map that places them, and the loading, error and empty states. Renders inside `WidgetRoot`.',
			},
		},
	},
	decorators: [ withCard, withWidgetRoot() ],
	args: {
		rows: COUNTRIES,
		status: READY,
		valueLabel: 'Views',
	},
};

export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {};

export const WithComparison: Story = {
	args: { status: { ...READY, hasComparison: true } },
};

export const UnitedStates: Story = {
	args: {
		rows: STATES,
		status: { ...READY, hasComparison: true },
		country: { code: 'US', name: 'United States' },
	},
};

export const Loading: Story = {
	args: { status: { isLoading: true } },
};

export const Failed: Story = {
	args: { status: { isLoading: false, isError: true, refetch: () => undefined } },
};

export const Empty: Story = {
	args: {
		rows: [],
		empty: { icon: location, description: 'No location data in this period.' },
	},
};
