import {
	computePrimaryRange,
	type ComparisonPresetId,
	type PrimaryPresetId,
	type YearSurfacePresetId,
} from '@jetpack-premium-analytics/datetime';
import { useCallback, useRef, useState } from 'react';
import { DateFiltersPanel } from '../../date-filters-panel';
import { DateYearFilter } from '../../date-year-filter';
import { getSectionSubtitle } from '../get-section-subtitle';
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
 * The applied date configuration the subtitle describes.
 */
type AppliedDateState = {
	range: DateRange;
	comparisonPresetId?: ComparisonPresetId;
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
 * @param props.onAppliedChange  - Reports the applied configuration upward.
 * @return The wired date filters panel.
 */
function RollingDateControls( {
	containerElement,
	onAppliedChange,
}: {
	containerElement: HTMLElement | null;
	onAppliedChange: ( applied: AppliedDateState ) => void;
} ) {
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
		onAppliedChange( { range: stagedRef.current.range, comparisonPresetId } );
	}, [ onAppliedChange, comparisonPresetId ] );

	const handleCancel = useCallback( () => {
		stagedRef.current = committed;
		setStaged( committed );
	}, [ committed ] );

	/*
	 * Mirrors `useReportDateFilters`: a comparison change commits on its own,
	 * so it moves the subtitle immediately, unlike a staged primary edit.
	 */
	const handleComparisonChange = useCallback(
		( _range: DateRange | undefined, nextPresetId?: ComparisonPresetId ) => {
			setComparisonPresetId( nextPresetId );
			onAppliedChange( { range: committed.range, comparisonPresetId: nextPresetId } );
		},
		[ onAppliedChange, committed.range ]
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
 * @param props.onRangeChange    - Reports the selected range upward.
 * @return The wired year filter.
 */
function YearDateControls( {
	containerElement,
	onRangeChange,
}: {
	containerElement: HTMLElement | null;
	onRangeChange: ( range: DateRange ) => void;
} ) {
	const [ presetId, setPresetId ] = useState< PrimaryPresetId >( 'all-time' as PrimaryPresetId );

	return (
		<DateYearFilter
			value={ presetId }
			onSelect={ ( range, nextPresetId: YearSurfacePresetId ) => {
				setPresetId( nextPresetId );
				onRangeChange( range );
			} }
			timeZone={ STORYBOOK_TIMEZONE }
			containerElement={ containerElement }
		/>
	);
}

type SectionHeaderStoryProps = {
	title: string;
	subtitle?: string;
};

function RollingSectionHeaderStory( { title }: SectionHeaderStoryProps ) {
	const [ container, setContainer ] = useState< HTMLDivElement | null >( null );
	const [ applied, setApplied ] = useState< AppliedDateState >( () => ( {
		range: buildInitialPrimaryState().range,
	} ) );

	return (
		<div ref={ setContainer }>
			<SectionHeader title={ title } subtitle={ getSectionSubtitle( applied ) }>
				<RollingDateControls containerElement={ container } onAppliedChange={ setApplied } />
			</SectionHeader>
		</div>
	);
}

function YearSectionHeaderStory( { title }: SectionHeaderStoryProps ) {
	const [ container, setContainer ] = useState< HTMLDivElement | null >( null );
	const [ range, setRange ] = useState< DateRange >( () => {
		const initial = computePrimaryRange( 'all-time', STORYBOOK_TIMEZONE );

		return { from: initial?.from, to: initial?.to };
	} );

	return (
		<div ref={ setContainer }>
			<SectionHeader title={ title } subtitle={ getSectionSubtitle( { range } ) }>
				<YearDateControls containerElement={ container } onRangeChange={ setRange } />
			</SectionHeader>
		</div>
	);
}

/**
 * The **Traffic-like** instance: rolling presets, custom range, and comparison
 * in the slot.
 *
 * The subtitle derives from the *applied* configuration, so it holds still
 * while a range edit is staged and only moves on Apply. Picking a comparison
 * moves it right away, matching how comparison commits on its own. Once the
 * interval control lands it will name the active interval too.
 */
export const Default: Story = {
	args: {
		title: 'Site traffic',
	},
	render: ( { title } ) => <RollingSectionHeaderStory title={ title } />,
};

/**
 * The **Insights-like** instance: the year surface (all time plus calendar
 * years) in the slot.
 *
 * Per the design's instances table, this surface carries *no comparison
 * control*. Its multi-year ranges are what the subtitle describes in years
 * rather than an unreadable month count.
 */
export const YearSurface: Story = {
	args: {
		title: 'Insights',
	},
	render: ( { title } ) => <YearSectionHeaderStory title={ title } />,
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
