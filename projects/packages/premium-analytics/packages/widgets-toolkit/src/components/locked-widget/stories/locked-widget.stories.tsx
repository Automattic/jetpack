import { withStoryRouter } from '../../../../../../widgets/stories/with-story-router';
import { LockedPage, LockedWidget } from '../locked-widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';

const TRAFFIC_SUPPORT = 'https://jetpack.com/support/jetpack-stats/traffic-dashboard/';
const PREMIUM = 'https://wordpress.com/checkout/example.com/premium';

// Copy as `src/stats-plan-gates.php` publishes it.
const LOCKED_FEATURES = {
	utm: {
		description: 'Generate UTM parameters and track your <link>campaign performance data</link>.',
		support_url: `${ TRAFFIC_SUPPORT }#harnessing-utm-stats-for-precision-tracking`,
		upgrade_url: PREMIUM,
	},
	devices: {
		description: 'See which <link>devices, browsers and OS</link> your visitors are using.',
		support_url: `${ TRAFFIC_SUPPORT }#devices-stats`,
		upgrade_url: PREMIUM,
	},
	'regions-cities': {
		description: 'Access to <link>region and city stats</link> for more accurate analysis.',
		support_url: `${ TRAFFIC_SUPPORT }#countries`,
		upgrade_url: PREMIUM,
	},
	insights: {
		description: 'Upgrade your plan to unlock Jetpack Stats.',
		support_url: '',
		upgrade_url: '',
	},
};

const meta: Meta< typeof LockedWidget > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/LockedWidget',
	component: LockedWidget,
	tags: [ 'autodocs' ],
	// On Jetpack sites the upgrade button is a router link.
	decorators: [ withStoryRouter ],
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component:
					"What a widget or report shows for a Stats feature the site's plan lacks: the server's sentence for the feature, with its support link, and an upgrade button when there is somewhere to buy it.",
			},
		},
	},
	argTypes: {
		feature: {
			control: 'select',
			options: Object.keys( LOCKED_FEATURES ),
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
					locked_features: LOCKED_FEATURES,
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
 * The UTM widget locked, in a dashboard tile.
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
