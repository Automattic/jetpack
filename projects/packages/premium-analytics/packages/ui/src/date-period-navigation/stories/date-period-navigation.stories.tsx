import { canStepForward, stepDateRange } from '@jetpack-premium-analytics/datetime';
import { useState } from 'react';
import { DatePeriodNavigation } from '../date-period-navigation';
import type { DateRange, StepDirection } from '@jetpack-premium-analytics/datetime';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof DatePeriodNavigation > = {
	title: 'Packages/Premium Analytics/UI/DatePeriodNavigation',
	component: DatePeriodNavigation,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Steps the active window backward and forward by its own length.\n\n' +
					'The forward control is absent rather than disabled while the window is the ' +
					'latest one available. `canStepForward` is a prop, derived upstream from the ' +
					'range, so availability follows where the window sits in time rather than a ' +
					'layout rule.',
			},
		},
	},
	argTypes: {
		onStep: { control: false },
	},
};

export default meta;

type Story = StoryObj< typeof DatePeriodNavigation >;

/**
 * Seven whole days ending at the given day.
 *
 * @param endingDaysAgo - How many days back the window ends.
 * @return The window.
 */
function weekEnding( endingDaysAgo: number ): DateRange {
	const to = new Date();
	to.setDate( to.getDate() - endingDaysAgo );
	to.setHours( 23, 59, 59, 999 );

	const from = new Date( to );
	from.setDate( from.getDate() - 6 );
	from.setHours( 0, 0, 0, 0 );

	return { from, to };
}

/**
 * The control wired to a real window, so stepping moves it and the forward
 * arrow appears and disappears the way it does in the panel.
 *
 * @param props                - Story props.
 * @param props.initialEndsAgo - How many days back the starting window ends.
 * @return The wired control.
 */
function DatePeriodNavigationWithState( { initialEndsAgo }: { initialEndsAgo: number } ) {
	const [ range, setRange ] = useState( () => weekEnding( initialEndsAgo ) );

	const step = ( direction: StepDirection ) => {
		const next = stepDateRange( range, direction );

		if ( next ) {
			setRange( next );
		}
	};

	return (
		<DatePeriodNavigation canStepForward={ canStepForward( range, new Date() ) } onStep={ step } />
	);
}

/**
 * The latest window: only the back arrow, since there is nothing after it.
 */
export const Default: Story = {
	render: () => <DatePeriodNavigationWithState initialEndsAgo={ 1 } />,
};

/**
 * A window already stepped back. Both arrows show; stepping forward to the
 * latest window drops the forward one again.
 */
export const SteppedBack: Story = {
	render: () => <DatePeriodNavigationWithState initialEndsAgo={ 15 } />,
};
