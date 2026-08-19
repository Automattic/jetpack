import { StaleDataNotice } from '../stale-data-notice';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof StaleDataNotice > = {
	title: 'Packages/Premium Analytics/UI/StaleDataNotice',
	component: StaleDataNotice,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Shown when a refresh failed while the data it was replacing is still ' +
					'on screen. The numbers stay: they are older than the reader asked ' +
					'for, not wrong — so this states their age instead of replacing them ' +
					'with an error.\n\nThe label ages on its own while the notice is ' +
					'mounted. `onRetry` is left out where retrying cannot help (auth, ' +
					'permissions), and the button goes with it.',
			},
		},
	},
	argTypes: {
		updatedAt: { control: false },
		onRetry: { control: false },
	},
};
export default meta;

type Story = StoryObj< typeof StaleDataNotice >;

const minutesAgo = ( minutes: number ) => Date.now() - minutes * 60 * 1000;

export const Default: Story = {
	args: {
		updatedAt: minutesAgo( 5 ),
		onRetry: () => {},
	},
};

export const WithoutRetry: Story = {
	name: 'Without retry',
	args: {
		updatedAt: minutesAgo( 42 ),
	},
};
