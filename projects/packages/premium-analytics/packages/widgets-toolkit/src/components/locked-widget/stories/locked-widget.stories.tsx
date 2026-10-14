import { LockedPage, LockedWidget } from '../locked-widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';

const meta: Meta< typeof LockedWidget > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/LockedWidget',
	component: LockedWidget,
	tags: [ 'autodocs' ],
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component:
					"What a widget or report shows for a Stats feature the site's plan lacks: the feature's sentence from classic Stats, with its support link, and an upgrade button when the server has somewhere to buy it.",
			},
		},
	},
	argTypes: {
		feature: {
			control: 'select',
			options: [ 'utm', 'devices', 'referrers', 'regions-cities', 'videos', 'insights' ],
			description: 'The locked feature, a key of `plan_gates.locked_features`.',
		},
	},
	beforeEach: () => {
		const scriptData = window.JetpackScriptData;
		window.JetpackScriptData = {
			...scriptData,
			premium_analytics: {
				...scriptData?.premium_analytics,
				initial_full_sync_finished: 1,
				plan_gates: {
					tier: 'free',
					locked_features: {
						utm: 'https://wordpress.com/checkout/example.com/premium',
						devices: 'https://wordpress.com/checkout/example.com/premium',
						referrers: 'https://wordpress.com/checkout/example.com/personal',
						'regions-cities': 'https://wordpress.com/checkout/example.com/premium',
						videos: 'https://wordpress.com/checkout/example.com/premium',
						insights: '',
					},
					locked_widget_types: {},
				},
			},
		} as typeof window.JetpackScriptData;
		return () => {
			window.JetpackScriptData = scriptData;
		};
	},
};

export default meta;

type Story = StoryObj< typeof LockedWidget >;

/**
 * A framed widget tile at dashboard size, header included, as the dashboard draws it.
 */
const WidgetCard = ( { title, children }: { title: string; children: ReactNode } ) => (
	<div
		style={ {
			width: '760px',
			height: '420px',
			border: '1px solid var(--wpds-color-stroke-surface-neutral-weak)',
			borderRadius: 'var(--wpds-border-radius-md)',
			background: 'var(--wpds-color-background-surface-neutral)',
			display: 'flex',
			flexDirection: 'column',
			overflow: 'hidden',
		} }
	>
		<div
			style={ {
				padding: 'var(--wpds-dimension-gap-lg)',
				fontWeight: 600,
				color: 'var(--wpds-color-foreground-content-neutral)',
			} }
		>
			{ title }
		</div>
		<div style={ { flex: 1, display: 'flex' } }>{ children }</div>
	</div>
);

/**
 * The UTM widget locked, to compare with the design.
 */
export const Default: Story = {
	args: { feature: 'utm' },
	decorators: [
		Story => (
			<WidgetCard title="UTM">
				<Story />
			</WidgetCard>
		),
	],
};

/**
 * A feature with no sentence of its own, such as Insights, gets the generic one; with nowhere to buy it, no button.
 */
export const GenericCopyWithoutUpgrade: Story = {
	args: { feature: 'insights' },
	decorators: Default.decorators,
};

/**
 * A short tile drops the lock and keeps the sentence and the button.
 */
export const ShortTile: Story = {
	args: { feature: 'devices' },
	decorators: [
		Story => (
			<div style={ { width: '360px', height: '200px', display: 'flex' } }>
				<Story />
			</div>
		),
	],
};

/**
 * A locked report tab, such as Regions on Locations.
 */
export const Page: Story = {
	render: () => <LockedPage feature="regions-cities" />,
	parameters: { layout: 'padded' },
};
