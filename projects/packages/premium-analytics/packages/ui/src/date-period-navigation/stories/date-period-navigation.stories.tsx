import { TZDate } from '@date-fns/tz';
import { planDateStep } from '@jetpack-premium-analytics/datetime';
import { subDays } from 'date-fns';
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
					'An arrow with nowhere to go is disabled rather than hidden. `canStepForward` ' +
					'and `canStepBackward` are props, derived upstream from the range and the ' +
					"plan's earliest date, so availability follows the data rather than a layout rule.",
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
	const end = subDays( new TZDate( Date.now(), 'UTC' ), endingDaysAgo );
	const start = subDays( end, 6 );

	return {
		from: new TZDate( start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0, 'UTC' ),
		to: new TZDate( end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999, 'UTC' ),
	};
}

/**
 * The control wired to a real window, so stepping moves it and the forward
 * arrow enables and disables the way it does in the panel.
 *
 * @param props                - Story props.
 * @param props.initialEndsAgo - How many days back the starting window ends.
 * @return The wired control.
 */
function DatePeriodNavigationWithState( { initialEndsAgo }: { initialEndsAgo: number } ) {
	const [ range, setRange ] = useState( () => weekEnding( initialEndsAgo ) );

	const context = { timeZone: 'UTC', now: new Date() };
	const step = ( direction: StepDirection ) => {
		const next = planDateStep( range, direction, context );

		if ( next ) {
			setRange( next.range );
		}
	};

	return (
		<DatePeriodNavigation
			canStepBackward={ planDateStep( range, 'previous', context ) !== undefined }
			canStepForward={ planDateStep( range, 'next', context ) !== undefined }
			onStep={ step }
		/>
	);
}

/**
 * The latest window: the forward arrow is disabled, since there is nothing after it.
 */
export const Default: Story = {
	render: () => <DatePeriodNavigationWithState initialEndsAgo={ 1 } />,
};

/**
 * A window already stepped back. Both arrows are live; stepping forward to the
 * latest window disables the forward one again.
 */
export const SteppedBack: Story = {
	render: () => <DatePeriodNavigationWithState initialEndsAgo={ 15 } />,
};

/**
 * The plan's earliest date reached: the back arrow is disabled.
 */
export const AtEarliestDate: Story = {
	args: { canStepBackward: false, canStepForward: true, onStep: () => {} },
};
