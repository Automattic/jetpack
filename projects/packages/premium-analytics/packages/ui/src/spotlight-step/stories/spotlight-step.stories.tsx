import { Button, IconButton, Stack, Text } from '@jetpack-premium-analytics/externals';
import { moreVertical } from '@wordpress/icons';
import { useState } from 'react';
import { SpotlightStep } from '../spotlight-step';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof SpotlightStep > = {
	title: 'Packages/Premium Analytics/UI/SpotlightStep',
	component: SpotlightStep,
	tags: [ 'autodocs' ],
	parameters: {
		controls: { disable: true },
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'One step of a spotlight tour. The page dims except for a halo around ' +
					'the anchor, and a card beside it carries the copy, the "n of m" ' +
					'counter and Continue, or Finish on the last step.\n\n' +
					'The step renders nothing until its anchor is mounted, so a tour can ' +
					'declare steps for elements that appear later. Escape calls ' +
					'`onDismiss`; clicks on the dimmed page do nothing, as the design has ' +
					'no skip control.',
			},
		},
	},
};
export default meta;

type Story = StoryObj< typeof SpotlightStep >;

const STEPS = [
	{
		title: 'Customize your experience',
		description:
			'Access customization from this menu. Move and resize widgets to prioritize what you need.',
	},
	{
		title: 'Improved date selection',
		description:
			'Simplified and more powerful. You can now compare your data with past periods and adjust your chart intervals.',
	},
	{
		title: 'Introducing widgets',
		description:
			'All data is delivered using powerful and versatile widgets for better visualization.',
	},
];

function TourDemo() {
	const [ step, setStep ] = useState< number | null >( 1 );
	const [ menu, setMenu ] = useState< HTMLElement | null >( null );
	const [ dates, setDates ] = useState< HTMLElement | null >( null );
	const [ widget, setWidget ] = useState< HTMLElement | null >( null );
	const anchors = [ menu, dates, widget ];

	const next = () =>
		setStep( current => ( current && current < STEPS.length ? current + 1 : null ) );

	return (
		<div style={ { padding: 24, minHeight: '100vh' } }>
			<Stack direction="row" justify="space-between" align="center">
				<Text variant="heading-xl">Site traffic</Text>
				<Stack direction="row" gap="sm" align="center">
					<div ref={ setDates }>
						<Button variant="outline" tone="neutral">
							Last 30 days
						</Button>
					</div>
					<IconButton
						ref={ setMenu }
						icon={ moreVertical }
						label="Options"
						variant="minimal"
						tone="neutral"
					/>
				</Stack>
			</Stack>
			<div
				ref={ setWidget }
				style={ {
					marginTop: 24,
					padding: 24,
					border: '1px solid var(--wpds-color-stroke-surface-neutral)',
					borderRadius: 'var(--wpds-border-radius-lg)',
				} }
			>
				<Text variant="heading-md">Traffic summary</Text>
			</div>
			{ step === null && (
				<Button
					variant="outline"
					tone="neutral"
					onClick={ () => setStep( 1 ) }
					style={ { marginTop: 24 } }
				>
					Restart the tour
				</Button>
			) }
			{ step !== null && (
				<SpotlightStep
					anchor={ anchors[ step - 1 ] }
					title={ STEPS[ step - 1 ].title }
					description={ STEPS[ step - 1 ].description }
					step={ step }
					totalSteps={ STEPS.length }
					onNext={ next }
					onDismiss={ () => setStep( null ) }
					side={ step === 3 ? 'top' : 'bottom' }
				/>
			) }
		</div>
	);
}

/**
 * The three onboarding steps on a mock of the dashboard header: the options
 * menu, the date controls and the first widget. Continue walks them, Finish
 * ends, Escape leaves at any point; the button that appears afterwards
 * restarts the tour.
 */
export const Default: Story = {
	render: () => <TourDemo />,
};
