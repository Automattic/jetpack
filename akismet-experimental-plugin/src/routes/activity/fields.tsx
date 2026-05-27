/**
 * DataViews field definitions for the Activity log.
 *
 * Each row uses the unified `ActivityRow` shape. Field types track the
 * `@wordpress/dataviews` v15 API:
 *   - `render` is a function component returning the cell's React tree.
 *   - `elements` on a field declares filter options inline (no separate
 *     filters config; v14+ folded filter definitions into the field).
 *   - `filterBy.isPrimary` marks a filter as always-visible in the toolbar.
 *
 * The five fields below are intentionally render-only — DataForm is out
 * of scope for this read-only Activity surface.
 */
import { __ } from '@wordpress/i18n';
import type {
	ActivityCategory,
	ActivityOutcome,
	ActivityRow,
	ActivitySource,
} from './activity-types';
import type { Field } from '@wordpress/dataviews';

/**
 * Format an ISO timestamp using the locale's medium date + short time.
 *
 * @param iso - ISO 8601 timestamp.
 * @return Formatted string.
 */
function formatDate( iso: string ): string {
	return new Intl.DateTimeFormat( undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
	} ).format( new Date( iso ) );
}

/**
 * Display label for a category id.
 *
 * @param c - Category id.
 * @return Translated label.
 */
function categoryLabel( c: ActivityCategory ): string {
	const map: Record< ActivityCategory, string > = {
		comments: __( 'Comments', 'akismet' ),
		forms: __( 'Forms', 'akismet' ),
		logins: __( 'Logins', 'akismet' ),
		checkouts: __( 'Checkouts', 'akismet' ),
		bots: __( 'Bots', 'akismet' ),
		'brute-force': __( 'Brute-force', 'akismet' ),
	};
	return map[ c ];
}

type OutcomeBadge = {
	label: string;
	tone: 'destructive' | 'warning' | 'success' | 'info';
};

/**
 * Map an outcome to a labelled tone for the badge.
 *
 * @param o - Outcome id.
 * @return Badge descriptor.
 */
function outcomeBadge( o: ActivityOutcome ): OutcomeBadge {
	const map: Record< ActivityOutcome, OutcomeBadge > = {
		block: { label: __( 'Blocked', 'akismet' ), tone: 'destructive' },
		'challenge-passed': {
			label: __( 'Challenge passed', 'akismet' ),
			tone: 'success',
		},
		'challenge-failed': {
			label: __( 'Challenge failed', 'akismet' ),
			tone: 'destructive',
		},
		'allowed-but-flagged': {
			label: __( 'Allowed (flagged)', 'akismet' ),
			tone: 'warning',
		},
	};
	return map[ o ];
}

/**
 * Filter option lists. Static — categories / outcomes / sources are
 * compile-time enums.
 */
const categoryOptions = [
	{ value: 'comments', label: __( 'Comments', 'akismet' ) },
	{ value: 'forms', label: __( 'Forms', 'akismet' ) },
	{ value: 'logins', label: __( 'Logins', 'akismet' ) },
	{ value: 'checkouts', label: __( 'Checkouts', 'akismet' ) },
	{ value: 'bots', label: __( 'Bots', 'akismet' ) },
	{ value: 'brute-force', label: __( 'Brute-force', 'akismet' ) },
];

const outcomeOptions = [
	{ value: 'block', label: __( 'Blocked', 'akismet' ) },
	{ value: 'challenge-passed', label: __( 'Challenge passed', 'akismet' ) },
	{ value: 'challenge-failed', label: __( 'Challenge failed', 'akismet' ) },
	{ value: 'allowed-but-flagged', label: __( 'Allowed (flagged)', 'akismet' ) },
];

const sourceOptions: Array< { value: ActivitySource; label: string } > = [
	{ value: 'akismet-content', label: 'akismet-content' },
	{ value: 'blackbox-behavioral', label: 'blackbox-behavioral' },
	{ value: 'blackbox-fingerprint', label: 'blackbox-fingerprint' },
	{ value: 'blackbox-edge', label: 'blackbox-edge' },
	{ value: 'woocommerce-fraud', label: 'woocommerce-fraud' },
	{ value: 'akismet-rules', label: 'akismet-rules' },
];

export const activityFields: Array< Field< ActivityRow > > = [
	{
		id: 'subject',
		label: __( 'What was it', 'akismet' ),
		enableSorting: false,
		enableHiding: false,
		render: ( { item } ) => (
			<div className="akismet-activity__subject">
				<span className="akismet-activity__subject-label">{ item.subject.label }</span>
				{ item.subject.secondary && (
					<span className="akismet-activity__subject-secondary">{ item.subject.secondary }</span>
				) }
				{ item.preview && (
					<span className="akismet-activity__preview-pill">{ __( 'Preview', 'akismet' ) }</span>
				) }
			</div>
		),
		getValue: ( { item } ) => item.subject.label,
	},
	{
		id: 'category',
		label: __( 'Category', 'akismet' ),
		enableSorting: false,
		elements: categoryOptions,
		filterBy: { operators: [ 'is' ], isPrimary: true },
		render: ( { item } ) => (
			<span className="akismet-activity__category">{ categoryLabel( item.category ) }</span>
		),
		getValue: ( { item } ) => item.category,
	},
	{
		id: 'outcome',
		label: __( 'Outcome', 'akismet' ),
		enableSorting: false,
		elements: outcomeOptions,
		filterBy: { operators: [ 'is' ], isPrimary: true },
		render: ( { item } ) => {
			const b = outcomeBadge( item.outcome );
			return (
				<span className={ `akismet-activity__outcome akismet-activity__outcome--${ b.tone }` }>
					{ b.label }
				</span>
			);
		},
		getValue: ( { item } ) => item.outcome,
	},
	{
		id: 'source',
		label: __( 'Source', 'akismet' ),
		enableSorting: false,
		elements: sourceOptions,
		filterBy: { operators: [ 'is' ] },
		render: ( { item } ) => <code className="akismet-activity__source">{ item.source }</code>,
		getValue: ( { item } ) => item.source,
	},
	{
		id: 'timestamp',
		label: __( 'When', 'akismet' ),
		enableSorting: true,
		filterBy: false,
		render: ( { item } ) => (
			<span className="akismet-activity__timestamp">{ formatDate( item.timestamp ) }</span>
		),
		getValue: ( { item } ) => item.timestamp,
	},
];
