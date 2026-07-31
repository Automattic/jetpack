import {
	computePrimaryRange,
	type ComparisonPresetId,
	type PrimaryPresetId,
	type YearSurfacePresetId,
} from '@jetpack-premium-analytics/datetime';
import { useCallback, useRef, useState } from 'react';
import { DateFiltersPanel } from '../../date-filters-panel';
import { DateYearFilter } from '../../date-year-filter';
import { SectionHeader } from '../section-header';
import type { DateRange } from '../../date-filters-panel/date-filters-panel';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof SectionHeader > = {
	title: 'Packages/Premium Analytics/UI/SectionHeader',
	component: SectionHeader,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Two-halves header for an analytics surface. The left half anchors the ' +
					'instance: a **title** naming the section plus a **subtitle** describing ' +
					'the active date configuration.\n\n' +
					'The right half is a slot: the consumer passes the date controls as ' +
					'`children`, keeps the date state, and derives the subtitle from the ' +
					'*applied* range, so the header stays purely presentational.',
			},
		},
	},
	argTypes: {
		children: { control: false },
	},
};
export default meta;

type Story = StoryObj< typeof SectionHeader >;

const STORYBOOK_TIMEZONE = 'America/New_York';

type PrimaryFilterState = {
	range: DateRange;
	presetId: PrimaryPresetId;
};

/**
 * Committed/staged seed mirroring the dashboard default: Last 30 days.
 *
 * @return The initial primary filter state.
 */
function buildInitialPrimaryState(): PrimaryFilterState {
	const range = computePrimaryRange( 'last-30-days', STORYBOOK_TIMEZONE );

	return {
		presetId: 'last-30-days',
		range: { from: range?.from, to: range?.to },
	};
}

/**
 * Rolling date controls for the slot, wired like the dashboard: staged primary
 * edits committed on Apply. A trimmed copy of the DateFiltersPanel story
 * harness.
 *
 * @param props                  - Harness props.
 * @param props.containerElement - Measured row element for responsive layout.
 * @return The wired date filters panel.
 */
function RollingDateControls( { containerElement }: { containerElement: HTMLElement | null } ) {
	const initial = buildInitialPrimaryState();

	const [ committed, setCommitted ] = useState( initial );
	const [ staged, setStaged ] = useState( initial );
	const stagedRef = useRef( staged );
	stagedRef.current = staged;

	const [ comparisonPresetId, setComparisonPresetId ] = useState< ComparisonPresetId | undefined >(
		undefined
	);

	const handleChange = useCallback( ( nextRange?: DateRange, nextPresetId?: PrimaryPresetId ) => {
		const next: PrimaryFilterState = {
			range: nextRange ?? stagedRef.current.range,
			presetId: nextPresetId ?? stagedRef.current.presetId,
		};

		stagedRef.current = next;
		setStaged( next );
	}, [] );

	const handleApply = useCallback( () => {
		setCommitted( stagedRef.current );
	}, [] );

	const handleCancel = useCallback( () => {
		stagedRef.current = committed;
		setStaged( committed );
	}, [ committed ] );

	const handleComparisonChange = useCallback(
		( _range: DateRange | undefined, nextPresetId?: ComparisonPresetId ) => {
			setComparisonPresetId( nextPresetId );
		},
		[]
	);

	const canApply =
		staged.range.from !== committed.range.from ||
		staged.range.to !== committed.range.to ||
		staged.presetId !== committed.presetId;

	return (
		<DateFiltersPanel
			presetId={ staged.presetId }
			range={ staged.range }
			appliedPresetId={ committed.presetId }
			appliedRange={ committed.range }
			comparisonPresetId={ comparisonPresetId }
			onChange={ handleChange }
			onComparisonChange={ handleComparisonChange }
			onApply={ handleApply }
			onCancel={ handleCancel }
			canApply={ canApply }
			timeZone={ STORYBOOK_TIMEZONE }
			containerElement={ containerElement }
		/>
	);
}

/**
 * Year-surface controls for the slot: all time plus calendar years, no
 * comparison, as the Insights instance specifies.
 *
 * @param props                  - Harness props.
 * @param props.containerElement - Measured row element for responsive layout.
 * @return The wired year filter.
 */
function YearDateControls( { containerElement }: { containerElement: HTMLElement | null } ) {
	const [ presetId, setPresetId ] = useState< PrimaryPresetId >( 'all-time' as PrimaryPresetId );

	return (
		<DateYearFilter
			value={ presetId }
			onSelect={ ( _range, nextPresetId: YearSurfacePresetId ) => setPresetId( nextPresetId ) }
			timeZone={ STORYBOOK_TIMEZONE }
			containerElement={ containerElement }
		/>
	);
}

type SectionHeaderStoryProps = {
	title: string;
	subtitle: string;
};

function RollingSectionHeaderStory( { title, subtitle }: SectionHeaderStoryProps ) {
	const [ container, setContainer ] = useState< HTMLDivElement | null >( null );

	return (
		<div ref={ setContainer }>
			<SectionHeader title={ title } subtitle={ subtitle }>
				<RollingDateControls containerElement={ container } />
			</SectionHeader>
		</div>
	);
}

function YearSectionHeaderStory( { title, subtitle }: SectionHeaderStoryProps ) {
	const [ container, setContainer ] = useState< HTMLDivElement | null >( null );

	return (
		<div ref={ setContainer }>
			<SectionHeader title={ title } subtitle={ subtitle }>
				<YearDateControls containerElement={ container } />
			</SectionHeader>
		</div>
	);
}

/**
 * The **Traffic-like** instance: rolling presets, custom range, and comparison
 * in the slot.
 *
 * The subtitle is a static arg here; in product it derives from the *applied*
 * preset/range and, once the interval control lands, the active interval.
 */
export const Default: Story = {
	args: {
		title: 'Site traffic',
		subtitle: 'Last 30 days',
	},
	render: ( { title, subtitle } ) => (
		<RollingSectionHeaderStory title={ title } subtitle={ subtitle } />
	),
};

/**
 * The **Insights-like** instance: the year surface (all time plus calendar
 * years) in the slot.
 *
 * Per the design's instances table, this surface carries *no comparison
 * control*.
 */
export const YearSurface: Story = {
	args: {
		title: 'Insights',
		subtitle: 'All time',
	},
	render: ( { title, subtitle } ) => (
		<YearSectionHeaderStory title={ title } subtitle={ subtitle } />
	),
};

/**
 * The left half on its own: nothing in the controls slot.
 */
export const WithoutControls: Story = {
	args: {
		title: 'Site traffic',
		subtitle: 'Last 30 days',
	},
	render: ( { title, subtitle } ) => <SectionHeader title={ title } subtitle={ subtitle } />,
};
