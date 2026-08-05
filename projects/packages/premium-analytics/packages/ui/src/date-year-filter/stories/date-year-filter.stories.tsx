import { useState } from 'react';
import { DateYearFilter } from '../date-year-filter';
import type { PrimaryPresetId, YearSurfacePresetId } from '@jetpack-premium-analytics/datetime';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof DateYearFilter > = {
	title: 'Packages/Premium Analytics/UI/DateYearFilter',
	component: DateYearFilter,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Whole-history date filter: all time, then one pill per calendar year. ' +
					'Selecting a year emits its full range; the current year and all time both ' +
					'end today. `startYear` sets the oldest year listed and where all time starts. ' +
					'The pills collapse to a select on their own once the measured container ' +
					'stops fitting them, unless a host sets `isCompact` itself.',
			},
		},
	},
};
export default meta;

type Story = StoryObj< typeof DateYearFilter >;

const STORYBOOK_TIMEZONE = 'America/New_York';

function DateYearFilterWithState( {
	initialPreset = 'all-time' as PrimaryPresetId,
	startYear,
	isCompact,
	containerElement,
}: {
	initialPreset?: PrimaryPresetId;
	startYear?: number;
	isCompact?: boolean;
	containerElement?: HTMLElement | null;
} ) {
	const [ presetId, setPresetId ] = useState< PrimaryPresetId >( initialPreset );

	return (
		<DateYearFilter
			value={ presetId }
			onSelect={ ( _range, nextPresetId: YearSurfacePresetId ) => setPresetId( nextPresetId ) }
			timeZone={ STORYBOOK_TIMEZONE }
			startYear={ startYear }
			isCompact={ isCompact }
			containerElement={ containerElement }
		/>
	);
}

export const Default: Story = {
	render: () => <DateYearFilterWithState />,
};

/*
 * A site with a decade of history. The surface asks for more room than the
 * six-year default, so it collapses to the select on containers that would
 * still fit the shorter list.
 */
export const LongHistory: Story = {
	render: () => <DateYearFilterWithState startYear={ new Date().getFullYear() - 9 } />,
};

/*
 * A preset from another surface (a rolling window or a custom range) leaves
 * every pill unpressed, the same way the quick presets drop their highlight.
 */
export const NoYearSelected: Story = {
	render: () => <DateYearFilterWithState initialPreset="last-30-days" />,
};

/*
 * The layout follows the measured container: resize the story frame and the
 * pills swap for the select as soon as they stop fitting. `containerElement`
 * points the measurement at this wrapper instead of the viewport.
 */
function MeasuredInContainer() {
	const [ container, setContainer ] = useState< HTMLDivElement | null >( null );

	return (
		<div
			ref={ setContainer }
			style={ {
				width: '100%',
				resize: 'horizontal',
				overflow: 'auto',
				border: '1px dotted violet',
				padding: '10px',
			} }
		>
			<DateYearFilterWithState containerElement={ container } />
		</div>
	);
}

export const MeasuredContainer: Story = {
	render: () => <MeasuredInContainer />,
	decorators: [
		Story => (
			<div style={ { width: '640px' } }>
				<Story />
			</div>
		),
	],
};

// An explicit `isCompact` overrides the measurement, for hosts that own the
// responsive decision themselves.
export const ForcedCompact: Story = {
	render: () => (
		<div style={ { width: '360px' } }>
			<DateYearFilterWithState isCompact />
		</div>
	),
};
