import { WidgetState } from '../widget-state';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof WidgetState > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/WidgetState',
	component: WidgetState,
	tags: [ 'autodocs' ],
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component:
					'Data-agnostic widget content-area state. Derives one state (error → loading → empty → ready, plus a busy overlay on background refetch) from four boolean signals and renders it. Callers map their fetch result to the signals and pass generic `error` / `empty` descriptors.',
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof WidgetState >;

/**
 * Widget card wrapper for the stories, simulating a widget container so each
 * state is shown within typical widget dimensions.
 */
const WidgetCard = ( { title, children }: { title: string; children: React.ReactNode } ) => (
	<div
		style={ {
			width: '320px',
			height: '260px',
			border: '1px solid var(--wpds-color-stroke-surface-neutral-weaker, #e0e0e0)',
			borderRadius: 'var(--wpds-border-radius-md, 8px)',
			background: 'var(--wpds-color-bg-surface-primary, #fff)',
			display: 'flex',
			flexDirection: 'column',
			overflow: 'hidden',
		} }
	>
		<div
			style={ {
				padding: 'var(--wpds-dimension-gap-lg, 16px)',
				borderBottom: '1px solid var(--wpds-color-stroke-surface-neutral-weaker, #e0e0e0)',
				fontWeight: 600,
				fontSize: 'var(--wpds-font-size-sm, 14px)',
				color: 'var(--wpds-color-fg-content-neutral, #1e1e1e)',
			} }
		>
			{ title }
		</div>
		<div style={ { flex: 1, display: 'flex' } }>{ children }</div>
	</div>
);

/**
 * Placeholder success content used by the ready / busy stories.
 */
const Rows = () => (
	<div style={ { flex: 1, padding: 'var(--wpds-dimension-gap-lg, 16px)' } }>
		<div>Row one</div>
		<div>Row two</div>
		<div>Row three</div>
	</div>
);

/**
 * First load: a fetch is in flight and there is no data yet, so the loading
 * overlay is shown instead of the children.
 */
export const Loading: Story = {
	args: {
		isLoading: true,
		isError: false,
		isEmpty: true,
		children: <Rows />,
	},
	decorators: [
		Story => (
			<WidgetCard title="Loading">
				<Story />
			</WidgetCard>
		),
	],
};

/**
 * The fetch failed. Shows the error message and a Retry action.
 */
export const Error: Story = {
	args: {
		isLoading: false,
		isError: true,
		isEmpty: false,
		error: {
			description: "We couldn't load this data. Please try again in a moment.",
			// eslint-disable-next-line no-console
			actions: [ { label: 'Retry', onClick: () => console.log( 'Retry clicked' ) } ],
		},
		children: <Rows />,
	},
	decorators: [
		Story => (
			<WidgetCard title="Error">
				<Story />
			</WidgetCard>
		),
	],
};

/**
 * Resolved with no rows. Uses a neutral glyph so it reads differently from the
 * error state.
 */
export const Empty: Story = {
	args: {
		isLoading: false,
		isError: false,
		isEmpty: true,
		empty: { description: 'No posts here yet.' },
		children: <Rows />,
	},
	decorators: [
		Story => (
			<WidgetCard title="Empty">
				<Story />
			</WidgetCard>
		),
	],
};

/**
 * Success: the children are rendered as-is.
 */
export const Ready: Story = {
	args: {
		isLoading: false,
		isError: false,
		isEmpty: false,
		children: <Rows />,
	},
	decorators: [
		Story => (
			<WidgetCard title="Ready">
				<Story />
			</WidgetCard>
		),
	],
};

/**
 * Background refetch: the children stay visible under a non-blocking busy
 * overlay while fresh data loads.
 */
export const Busy: Story = {
	args: {
		isLoading: false,
		isFetching: true,
		isError: false,
		isEmpty: false,
		children: <Rows />,
	},
	decorators: [
		Story => (
			<WidgetCard title="Busy (background refetch)">
				<Story />
			</WidgetCard>
		),
	],
};
