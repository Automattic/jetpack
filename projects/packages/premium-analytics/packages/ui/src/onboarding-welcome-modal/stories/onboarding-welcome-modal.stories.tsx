import { Button, Stack, Text } from '@jetpack-premium-analytics/externals';
import { useState } from 'react';
import { OnboardingWelcomeModal } from '../onboarding-welcome-modal';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof OnboardingWelcomeModal > = {
	title: 'Packages/Premium Analytics/UI/OnboardingWelcomeModal',
	component: OnboardingWelcomeModal,
	tags: [ 'autodocs' ],
	parameters: {
		controls: { disable: true },
		docs: {
			description: {
				component:
					'The first step of the Stats v2 onboarding: a dialog that introduces ' +
					'the new experience over the widget grid animation and hands off to ' +
					'the tour.\n\n' +
					'The consumer owns the open state. `onStart` fires when the reader ' +
					'presses Take a quick tour; `onDismiss` when they close the dialog any other ' +
					'way, naming which (the close button, Escape, a click outside). The ' +
					'onboarding hook decides what each one means for the journey.\n\n' +
					'On viewports too short for the animation, the copy and the tour button ' +
					'take the room instead; on the ones in between, the content scrolls ' +
					'while the footer stays pinned.',
			},
		},
	},
};
export default meta;

type Story = StoryObj< typeof OnboardingWelcomeModal >;

function WelcomeModalDemo() {
	const [ open, setOpen ] = useState( true );
	const [ outcome, setOutcome ] = useState< string | null >( null );

	const close = ( result: string ) => {
		setOutcome( result );
		setOpen( false );
	};

	return (
		<Stack direction="column" gap="md" align="flex-start">
			<Button variant="outline" tone="neutral" onClick={ () => setOpen( true ) }>
				Open the welcome modal
			</Button>
			{ outcome && <Text variant="body-md">Last outcome: { outcome }</Text> }
			<OnboardingWelcomeModal
				open={ open }
				onStart={ () => close( 'started the tour' ) }
				onDismiss={ reason => close( `dismissed (${ reason })` ) }
			/>
		</Stack>
	);
}

/**
 * Opens on load, as it would on a reader's first visit. Take a quick tour and the
 * close button both close it here and report which one the reader chose;
 * the button below reopens it.
 */
export const Default: Story = {
	render: () => <WelcomeModalDemo />,
};
