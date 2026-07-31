import {
	computePrimaryRange,
	type ComparisonPresetId,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
import { setLocaleData, resetLocaleData } from '@wordpress/i18n';
import { endOfDay, subDays, startOfDay } from 'date-fns';
import { useCallback, useRef, useState } from 'react';
import { DateFiltersPanel } from '../date-filters-panel';
import type { DateRange } from '../date-filters-panel';
import type { Meta, StoryObj } from '@storybook/react';

const STORYBOOK_TIMEZONE = 'America/New_York';

const meta: Meta< typeof DateFiltersPanel > = {
	title: 'Packages/Premium Analytics/UI/DateFiltersPanel',
	component: DateFiltersPanel,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Dashboard date filters: primary date range (surface presets + custom calendar) ' +
					'and optional comparison range.',
			},
		},
	},
};
export default meta;

type Story = StoryObj< typeof DateFiltersPanel >;

type PrimaryFilterState = {
	range: DateRange;
	presetId: PrimaryPresetId;
};

function buildPrimaryState( presetId: PrimaryPresetId = 'last-30-days' ): PrimaryFilterState {
	if ( presetId === 'custom' ) {
		const today = new Date();

		return {
			presetId,
			range: {
				from: startOfDay( subDays( today, 14 ) ),
				to: endOfDay( subDays( today, 3 ) ),
			},
		};
	}

	const range = computePrimaryRange( presetId, STORYBOOK_TIMEZONE );

	if ( range?.from && range.to ) {
		return {
			presetId,
			range: { from: range.from, to: range.to },
		};
	}

	const today = new Date();

	return {
		presetId,
		range: {
			from: startOfDay( subDays( today, 7 ) ),
			to: endOfDay( subDays( today, 1 ) ),
		},
	};
}

type DateFiltersPanelStoryProps = {
	initialPreset?: PrimaryPresetId;
	withComparison?: boolean;
	initialComparisonPreset?: ComparisonPresetId;
	containerWidth?: string | number;
};

/**
 * Mirrors the dashboard wiring: staged primary edits, committed on Apply (or
 * immediately for quick presets), and comparison enabled via preset ID.
 */
function DateFiltersPanelStory( {
	initialPreset = 'last-7-days',
	withComparison = true,
	initialComparisonPreset = 'previous-period',
	containerWidth = '100%',
}: DateFiltersPanelStoryProps ) {
	const initialPrimary = buildPrimaryState( initialPreset );

	const [ committedPrimary, setCommittedPrimary ] = useState( initialPrimary );
	const [ stagedPrimary, setStagedPrimary ] = useState( initialPrimary );
	const stagedPrimaryRef = useRef( stagedPrimary );
	stagedPrimaryRef.current = stagedPrimary;

	const [ comparisonPresetId, setComparisonPresetId ] = useState< ComparisonPresetId | undefined >(
		withComparison ? initialComparisonPreset : undefined
	);

	const handlePrimaryChange = useCallback(
		( nextRange?: DateRange, nextPresetId?: PrimaryPresetId ) => {
			const nextPrimary: PrimaryFilterState = {
				range: nextRange ?? stagedPrimaryRef.current.range,
				presetId: nextPresetId ?? stagedPrimaryRef.current.presetId,
			};

			stagedPrimaryRef.current = nextPrimary;
			setStagedPrimary( nextPrimary );
		},
		[]
	);

	const handlePrimaryApply = useCallback( () => {
		setCommittedPrimary( stagedPrimaryRef.current );
	}, [] );

	const handlePrimaryCancel = useCallback( () => {
		stagedPrimaryRef.current = committedPrimary;
		setStagedPrimary( committedPrimary );
	}, [ committedPrimary ] );

	const handleComparisonChange = useCallback(
		(
			_nextComparisonRange: DateRange | undefined,
			nextComparisonPresetId?: ComparisonPresetId
		) => {
			setComparisonPresetId( nextComparisonPresetId );

			const hasPrimaryDraft =
				stagedPrimaryRef.current.range.from !== committedPrimary.range.from ||
				stagedPrimaryRef.current.range.to !== committedPrimary.range.to ||
				stagedPrimaryRef.current.presetId !== committedPrimary.presetId;

			if ( ! hasPrimaryDraft && nextComparisonPresetId ) {
				// Comparison commits immediately when the primary range is not mid-edit.
				setCommittedPrimary( stagedPrimaryRef.current );
			}
		},
		[ committedPrimary ]
	);

	const canApplyPrimary =
		stagedPrimary.range.from !== committedPrimary.range.from ||
		stagedPrimary.range.to !== committedPrimary.range.to ||
		stagedPrimary.presetId !== committedPrimary.presetId;

	return (
		<div
			style={ {
				width: containerWidth,
				// An explicit width is a measurement, so it must not be clamped.
				maxWidth: containerWidth === '100%' ? '960px' : undefined,
			} }
		>
			<DateFiltersPanel
				presetId={ stagedPrimary.presetId }
				range={ stagedPrimary.range }
				appliedPresetId={ committedPrimary.presetId }
				appliedRange={ committedPrimary.range }
				comparisonPresetId={ comparisonPresetId }
				onChange={ handlePrimaryChange }
				onComparisonChange={ handleComparisonChange }
				onApply={ handlePrimaryApply }
				onCancel={ handlePrimaryCancel }
				canApply={ canApplyPrimary }
				timeZone={ STORYBOOK_TIMEZONE }
			/>
		</div>
	);
}

/**
 * Default dashboard filters row: Last 30 days with comparison to the previous period.
 */
export const DashboardFilters: Story = {
	render: () => <DateFiltersPanelStory />,
};

/**
 * Primary range only — comparison disabled until a preset is picked from the
 * comparison select.
 */
export const WithoutComparison: Story = {
	render: () => <DateFiltersPanelStory withComparison={ false } />,
};

/**
 * Custom primary range with comparison to the previous period.
 */
export const CustomRangeWithComparison: Story = {
	render: () => (
		<DateFiltersPanelStory initialPreset="custom" initialComparisonPreset="previous-period" />
	),
};

/**
 * Narrow container: the presets shorten to their abbreviated form rather than
 * collapsing to the select, which only fires once even the abbreviated row stops
 * fitting. In English that is well below this width.
 */
export const AbbreviatedLabels: Story = {
	render: () => <DateFiltersPanelStory containerWidth={ 360 } />,
};

/*
 * Translated stories.
 *
 * The panel is laid out for English, where every preset label is short. These
 * stories run it through real translations so the layout is reviewed against
 * the strings it will actually hold.
 *
 * Every translation below is taken from a shipped WordPress.org language pack,
 * never invented, so the widths are what users see rather than a guess:
 *
 * - Presets and `Custom` come from the Jetpack plugin's own pack.
 * - `Previous period` / `Previous year` come from WooCommerce, which already
 *   ships them. Jetpack does not.
 * - `All time` reuses the translation of Jetpack Stats' `All-time`. Note the
 *   hyphen: this package introduced a near-duplicate msgid, so at runtime it
 *   gets no translation at all and falls back to English.
 * - `Previous month` and `No comparison` are translated nowhere, so they stay
 *   English here too. That is today's real behavior, and it means these stories
 *   understate the comparison menu's eventual width.
 *
 * Locales were picked by measuring all 15 that translate the full preset set,
 * not by intuition. German is only 7th (1.24x English); Russian is the widest
 * by a wide margin, and CJK is narrower than English.
 */

/*
 * Everything from here down quotes translated strings, so a spell checker has
 * nothing useful to say about it.
 *
 * cspell:disable
 */

type LocaleFixture = {
	/** Human-facing name for the story description. */
	name: string;
	/** Measured width of the four preset pills, in CSS px at 13px system font. */
	presetGroupWidth: number;
	/** Preset group width relative to English. */
	ratio: number;
	/** Jed-shaped locale data for `setLocaleData`. */
	translations: Record< string, string >;
};

const TEXT_DOMAIN = 'jetpack-premium-analytics-pkg';

/** Widest of the 15 measured locales, at 1.49x English. */
const RUSSIAN: LocaleFixture = {
	name: 'Russian',
	presetGroupWidth: 572,
	ratio: 1.49,
	translations: {
		'Last 24 hours': 'Последние 24 часа',
		'Last 7 days': 'Последние 7 дней',
		'Last 30 days': 'Последние 30 дней',
		'Last 12 months': 'Последние 12 месяцев',
		Custom: 'Произвольно',
		'All time': 'Всё время',
		'Previous period': 'Предыдущий период',
		'Previous year': 'Предыдущий год',
	},
};

/** Widest Latin-script locale, at 1.37x English. */
const DUTCH: LocaleFixture = {
	name: 'Dutch',
	presetGroupWidth: 526,
	ratio: 1.37,
	translations: {
		'Last 24 hours': 'Laatste 24 uur',
		'Last 7 days': 'Afgelopen 7 dagen',
		'Last 30 days': 'Afgelopen 30 dagen',
		'Last 12 months': 'Afgelopen 12 maanden',
		Custom: 'Aangepast',
		'All time': 'Aller tijden',
		'Previous period': 'Vorige periode',
		'Previous year': 'Vorig jaar',
	},
};

/*
 * The locale everyone expects to be worst, which measures 7th. Kept as the
 * control, and because it holds the widest single Latin pill
 * ("Die letzten 24 Stunden", 139px) plus the non-breaking space that German
 * and French packs use between a number and its unit.
 */
const GERMAN: LocaleFixture = {
	name: 'German',
	presetGroupWidth: 478,
	ratio: 1.24,
	translations: {
		'Last 24 hours': 'Die letzten 24 Stunden',
		'Last 7 days': 'Letzte 7 Tage',
		'Last 30 days': 'Letzte 30 Tage',
		'Last 12 months': 'Letzte 12 Monate',
		Custom: 'Individuell',
		'All time': 'Gesamte Zeit',
		'Previous period': 'Vorherige Periode',
		'Previous year': 'Vorjahr',
	},
};

/**
 * Install a fixture's translations for the duration of one story.
 *
 * `setLocaleData` writes to the global i18n singleton, hence the cleanup: the
 * locale would otherwise leak into the next story opened. Same reason these are
 * off the autodocs page, which renders every sibling at once.
 *
 * @param fixture - The locale to install.
 * @return Storybook `beforeEach` handler.
 */
function withLocale( fixture: LocaleFixture ) {
	return () => {
		setLocaleData(
			Object.fromEntries(
				Object.entries( fixture.translations ).map( ( [ msgid, msgstr ] ) => [ msgid, [ msgstr ] ] )
			),
			TEXT_DOMAIN
		);

		// Data first, domain second: passing the domain alone would install it
		// as the locale data and leave every label untranslated.
		return () => resetLocaleData( undefined, TEXT_DOMAIN );
	};
}

/*
 * Widths worth reviewing: 782 is wp-admin's mobile breakpoint, 600 was the old
 * fixed compact threshold, and 280 is narrow enough to squeeze the custom
 * trigger's own label.
 */
const LADDER_WIDTHS = [ 960, 782, 600, 360, 280 ];

/**
 * One locale's bar at each reference width, so the point where it stops fitting
 * is visible rather than asserted.
 *
 * Rungs are annotated against the four preset pills alone. That is a floor: the
 * custom trigger, the comparison control, and the arrows and interval button the
 * design adds all come out of the same line.
 *
 * @param props         - Component props.
 * @param props.fixture - The locale to render.
 */
function WidthLadder( { fixture }: { fixture: LocaleFixture } ) {
	return (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '32px' } }>
			<div style={ { fontSize: '12px', lineHeight: 1.5 } }>
				{ `${ fixture.name }: preset pills measure ${ fixture.presetGroupWidth }px, ` +
					`${ fixture.ratio }x English (385px).` }
			</div>
			{ LADDER_WIDTHS.map( width => (
				<div key={ width } style={ { display: 'flex', flexDirection: 'column', gap: '8px' } }>
					<div
						style={ {
							fontSize: '11px',
							letterSpacing: '0.05em',
							textTransform: 'uppercase',
							opacity: 0.6,
						} }
					>
						{ `${ width }px container — presets alone ` +
							`${
								fixture.presetGroupWidth > width
									? `overflow by ${ fixture.presetGroupWidth - width }px`
									: `leave ${ width - fixture.presetGroupWidth }px for everything else`
							}` }
					</div>
					<DateFiltersPanelStory containerWidth={ width } />
				</div>
			) ) }

			{ /*
			 * Dragging across a boundary is the part the fixed rungs cannot show:
			 * whether the mode settles in one state or flickers between two. Both
			 * transitions are in reach here, full to abbreviated first and the
			 * select further down, and where they land differs per locale.
			 */ }
			<div
				style={ {
					width: '90%',
					resize: 'horizontal',
					overflow: 'auto',
					border: '1px dotted violet',
					padding: '24px 0',
				} }
			>
				<div
					style={ {
						fontSize: '12px',
						letterSpacing: '0.05em',
						textTransform: 'uppercase',
						opacity: 0.6,
						marginBottom: '16px',
					} }
				>
					Resize the container to see the effect on the layout
				</div>
				<DateFiltersPanelStory />
			</div>
		</div>
	);
}

/**
 * Russian, the widest of the 15 measured locales. Its preset pills alone need
 * about 572px against English's 385px.
 */
export const TranslatedRussian: Story = {
	tags: [ '!autodocs' ],
	beforeEach: withLocale( RUSSIAN ),
	render: () => <WidthLadder fixture={ RUSSIAN } />,
};

/**
 * Dutch, the widest Latin-script locale. Compounds like "Afgelopen 12 maanden"
 * carry the cost here.
 */
export const TranslatedDutch: Story = {
	tags: [ '!autodocs' ],
	beforeEach: withLocale( DUTCH ),
	render: () => <WidthLadder fixture={ DUTCH } />,
};

/**
 * German, as a control. It holds the widest single Latin pill but measures only
 * 1.24x English overall, so it is not the worst case the layout must survive.
 */
export const TranslatedGerman: Story = {
	tags: [ '!autodocs' ],
	beforeEach: withLocale( GERMAN ),
	render: () => <WidthLadder fixture={ GERMAN } />,
};
