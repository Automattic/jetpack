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
					'with an error.\n\nThe visible label ages on its own while the notice ' +
					'is mounted; the screen-reader announcement deliberately does not, so ' +
					'it is not repeated every minute. `onRetry` is left out where retrying ' +
					'cannot help (auth, permissions, a malformed response), and the button ' +
					'goes with it.',
			},
		},
	},
	argTypes: {
		updatedAt: { control: false },
		onRetry: { control: false },
		isRetrying: { control: 'boolean' },
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

export const Retrying: Story = {
	args: {
		updatedAt: minutesAgo( 5 ),
		onRetry: () => {},
		isRetrying: true,
	},
};

export const JustFetched: Story = {
	name: 'Less than a minute old',
	args: {
		updatedAt: Date.now(),
		onRetry: () => {},
	},
};
