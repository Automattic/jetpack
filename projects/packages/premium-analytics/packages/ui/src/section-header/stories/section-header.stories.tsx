import {
	computePrimaryRange,
	PRESET_ALL_TIME,
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
	presetId?: PrimaryPresetId;
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
 * Whether the primary picker is holding an un-applied edit.
 *
 * One predicate for two rules, the way `useReportDateFilters` has it: it gates
 * Apply, and it decides whether a comparison change commits on its own.
 *
 * @param staged    - The staged primary state.
 * @param committed - The applied primary state.
 * @return Whether the two differ.
 */
function hasPrimaryDraft( staged: PrimaryFilterState, committed: PrimaryFilterState ): boolean {
	return (
		staged.range.from !== committed.range.from ||
		staged.range.to !== committed.range.to ||
		staged.presetId !== committed.presetId
	);
}

/**
 * Rolling date controls for the slot, wired like the dashboard: staged primary
 * edits committed on Apply. A trimmed copy of the DateFiltersPanel story
 * harness.
 *
 * @param props                 - Harness props.
 * @param props.onAppliedChange - Reports the applied configuration upward.
 * @return The wired date filters panel.
 */
function RollingDateControls( {
	onAppliedChange,
}: {
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
		onAppliedChange( {
			range: stagedRef.current.range,
			presetId: stagedRef.current.presetId,
			comparisonPresetId,
		} );
	}, [ onAppliedChange, comparisonPresetId ] );

	const handleCancel = useCallback( () => {
		stagedRef.current = committed;
		setStaged( committed );
	}, [ committed ] );

	/*
	 * Mirrors `useReportDateFilters`: a comparison change commits on its own, so
	 * it moves the subtitle right away. Not while a primary edit is staged,
	 * though — then it rides along and both land on Apply, so tweaking the
	 * comparison never commits an un-applied primary draft.
	 */
	const handleComparisonChange = useCallback(
		( _range: DateRange | undefined, nextPresetId?: ComparisonPresetId ) => {
			setComparisonPresetId( nextPresetId );

			if ( ! hasPrimaryDraft( stagedRef.current, committed ) ) {
				onAppliedChange( {
					range: committed.range,
					presetId: committed.presetId,
					comparisonPresetId: nextPresetId,
				} );
			}
		},
		[ onAppliedChange, committed ]
	);

	const canApply = hasPrimaryDraft( staged, committed );

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
		/>
	);
}

/**
 * Year-surface controls for the slot: all time plus calendar years, no
 * comparison, as the Insights instance specifies.
 *
 * @param props                   - Harness props.
 * @param props.containerElement  - Measured row element for responsive layout.
 * @param props.onSelectionChange - Reports the selected range and preset upward.
 * @return The wired year filter.
 */
function YearDateControls( {
	containerElement,
	onSelectionChange,
}: {
	containerElement: HTMLElement | null;
	onSelectionChange: ( selection: AppliedDateState ) => void;
} ) {
	const [ presetId, setPresetId ] = useState< YearSurfacePresetId >( PRESET_ALL_TIME );

	return (
		<DateYearFilter
			value={ presetId }
			onSelect={ ( range, nextPresetId: YearSurfacePresetId ) => {
				setPresetId( nextPresetId );
				onSelectionChange( { range, presetId: nextPresetId } );
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
	const [ applied, setApplied ] = useState< AppliedDateState >( () => {
		const initial = buildInitialPrimaryState();

		return { range: initial.range, presetId: initial.presetId };
	} );

	return (
		<SectionHeader title={ title } subtitle={ getSectionSubtitle( applied ) }>
			<RollingDateControls onAppliedChange={ setApplied } />
		</SectionHeader>
	);
}

function YearSectionHeaderStory( { title }: SectionHeaderStoryProps ) {
	const [ container, setContainer ] = useState< HTMLDivElement | null >( null );
	const [ applied, setApplied ] = useState< AppliedDateState >( () => {
		const initial = computePrimaryRange( PRESET_ALL_TIME, STORYBOOK_TIMEZONE );

		return { range: { from: initial?.from, to: initial?.to }, presetId: PRESET_ALL_TIME };
	} );

	return (
		<div ref={ setContainer }>
			<SectionHeader title={ title } subtitle={ getSectionSubtitle( applied ) }>
				<YearDateControls containerElement={ container } onSelectionChange={ setApplied } />
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
