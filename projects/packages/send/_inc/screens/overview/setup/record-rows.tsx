import { __, sprintf } from '@wordpress/i18n';
import { border, error, published } from '@wordpress/icons';
import { Badge, Icon, Stack, Text } from '@wordpress/ui';
import { CopyIconButton } from '../../../components/copy-button';
import {
	blankHostLabel,
	copyValue,
	formatHost,
	isLongValue,
	truncateValue,
	valueLabel,
} from '../../../components/onboarding/providers';
import type { Provider } from '../../../components/onboarding/providers';
import type { DnsLookupRecord, DnsPurpose, DnsRecord, DnsRecordProblem } from '../../../data/types';
import type { ComponentProps } from 'react';

/** A record whose value was merged into one the domain already has (see `mergeLockdown`). */
export type DisplayRecord = DnsRecord & { mergedFrom?: string };

/** A row's state, including the client-only `waiting` and `checking`. */
export type RowState = 'waiting' | 'checking' | 'not_found' | 'found' | 'needs_fix';

/**
 * What record 1 should hold when the domain already has one from its host: the old value plus ours.
 *
 * @param existing - The value already published, or null.
 * @param ours     - Our value, e.g. `v=mc1 auth=abc`.
 * @return The merged value, or null when there's nothing to merge.
 */
export function mergeLockdown( existing: string | null | undefined, ours: string ): string | null {
	const current = ( existing ?? '' ).replace( /"/g, '' ).trim();
	if ( ! current ) {
		return null;
	}
	const missing = ours
		.split( /\s+/ )
		.filter( part => part && ! /^v=/i.test( part ) && ! current.split( /\s+/ ).includes( part ) );
	return missing.length ? `${ current } ${ missing.join( ' ' ) }` : null;
}

/**
 * What a record does, in plain words.
 *
 * @param purpose - Record purpose.
 * @return The label.
 */
export function rowPurposeLabel( purpose: DnsPurpose ): string {
	switch ( purpose ) {
		case 'lockdown':
			return __( 'Lets Jetpack send for you', 'jetpack-send-pkg' );
		case 'dkim':
			return __( 'Proves the emails are really yours', 'jetpack-send-pkg' );
		default:
			return __( 'Lists Jetpack as an approved sender', 'jetpack-send-pkg' );
	}
}

/**
 * A row's state from its lookup row. A lookup in flight changes nothing, so polls don't flash a badge.
 *
 * @param row - The lookup row, or undefined before the first lookup.
 * @return The state.
 */
export function rowState( row: DnsLookupRecord | undefined ): RowState {
	if ( row?.state === 'found' || row?.state === 'verified' ) {
		return 'found';
	}
	if ( row?.state === 'needs_fix' ) {
		return 'needs_fix';
	}
	// DNS didn't answer, so we don't know yet: never "missing".
	if ( row?.state === 'no_answer' ) {
		return 'checking';
	}
	return row ? 'not_found' : 'waiting';
}

type BadgeIntent = NonNullable< ComponentProps< typeof Badge >[ 'intent' ] >;

/**
 * What a record that needs a fix has wrong, in two or three words.
 *
 * @param problem - What's wrong.
 * @return The label.
 */
function fixLabel( problem?: DnsRecordProblem ): string {
	switch ( problem ) {
		case 'wrong_value':
			return __( 'Doesn’t match', 'jetpack-send-pkg' );
		case 'doubled':
			return __( 'Name doubled', 'jetpack-send-pkg' );
		case 'conflict':
			return __( 'Old record in the way', 'jetpack-send-pkg' );
		case 'proxied':
			return __( 'Proxy on', 'jetpack-send-pkg' );
		case 'not_live':
			return __( 'Not live yet', 'jetpack-send-pkg' );
		default:
			return __( 'Needs a change', 'jetpack-send-pkg' );
	}
}

/**
 * Badge for a row state, or null when the row's icon and the waiting note say enough. A record
 * that needs a fix says what's wrong with it. After setup, a record that can't be found has gone
 * missing rather than not arrived yet.
 *
 * @param state      - Row state.
 * @param problem    - What's wrong, for a row that needs a fix.
 * @param afterSetup - The records passed once, so a missing one was removed.
 * @return Intent and label, or null for no badge.
 */
export function rowBadge(
	state: RowState,
	problem?: DnsRecordProblem,
	afterSetup = false
): { intent: BadgeIntent; label: string } | null {
	switch ( state ) {
		case 'found':
			return { intent: 'stable', label: __( 'Found', 'jetpack-send-pkg' ) };
		case 'needs_fix':
			return { intent: 'medium', label: fixLabel( problem ) };
		case 'checking':
			return { intent: 'informational', label: __( 'Checking', 'jetpack-send-pkg' ) };
		case 'not_found':
			// During setup the dashed icon and the waiting note already say it isn't there yet.
			return afterSetup ? { intent: 'medium', label: __( 'Missing', 'jetpack-send-pkg' ) } : null;
		default:
			return null;
	}
}

/**
 * The status glyph for a row state.
 *
 * @param state - Row state.
 * @return The icon.
 */
function rowIcon( state: RowState ) {
	if ( state === 'found' ) {
		return published;
	}
	return state === 'needs_fix' ? error : border;
}

type FieldLineProps = {
	label: string;
	value: string;
	display?: string;
	copyText?: string;
	copyLabel: string;
	blank?: boolean;
	onCopy?: () => void;
};

const FieldLine = ( {
	label,
	value,
	display,
	copyText,
	copyLabel,
	blank = false,
	onCopy,
}: FieldLineProps ) => (
	<div className="jetpack-send-setup__field">
		<Text variant="body-md" render={ <dt /> } className="jetpack-send-setup__weak">
			{ label }
		</Text>
		<Stack
			render={ <dd /> }
			direction="row"
			align="center"
			gap="sm"
			className="jetpack-send-setup__field-value"
		>
			{ blank ? (
				<Text variant="body-md">{ blankHostLabel() }</Text>
			) : (
				<>
					<code className="jetpack-send-setup__value" title={ display ? value : undefined }>
						{ display ?? value }
					</code>
					<CopyIconButton text={ copyText ?? value } label={ copyLabel } onCopy={ onCopy } />
				</>
			) }
		</Stack>
	</div>
);

type Props = {
	records: DisplayRecord[];
	provider: Provider;
	/** Lookup rows by purpose. */
	rows: Partial< Record< DnsPurpose, DnsLookupRecord > >;
	/** A Copy button was used; polling speeds up. */
	onCopy?: () => void;
	/** A line under a row saying what to do, for rows whose fix differs from the others. */
	notes?: Partial< Record< DnsPurpose, string > >;
	/** The records passed once (the Overview after setup): a record that can't be found is Missing. */
	afterSetup?: boolean;
};

/**
 * The records to add, one row each, in the provider's own field names.
 *
 * @param props            - Component props.
 * @param props.records    - Records in display order.
 * @param props.provider   - Where they're added.
 * @param props.rows       - Lookup rows by purpose.
 * @param props.onCopy     - Called after a copy.
 * @param props.notes      - Per-row fixes, by purpose.
 * @param props.afterSetup - The records passed once.
 * @return The list.
 */
const RecordRows = ( { records, provider, rows, onCopy, notes, afterSetup = false }: Props ) => (
	<ul className="jetpack-send-setup__records" role="list">
		{ records.map( ( record, i ) => {
			const number = i + 1;
			const state = rowState( rows[ record.purpose ] );
			// The host's own record is there without Jetpack: its note says to edit it, not replace it.
			const editExisting =
				! afterSetup &&
				record.purpose === 'lockdown' &&
				!! record.mergedFrom &&
				( state === 'not_found' || state === 'waiting' );
			const badge: ReturnType< typeof rowBadge > = editExisting
				? { intent: 'informational', label: __( 'Edit existing', 'jetpack-send-pkg' ) }
				: rowBadge( state, rows[ record.purpose ]?.problem, afterSetup );
			const note = notes?.[ record.purpose ];
			const host = formatHost( record, provider );
			const long = isLongValue( record.value );
			const value = valueLabel( record, provider );
			const copyLabel = ( field: string ) =>
				sprintf(
					/* translators: 1: the provider's field name in lower case, e.g. "name" or "content". 2: record number, 1 or 2. */
					__( 'Copy %1$s, record %2$d', 'jetpack-send-pkg' ),
					field.toLocaleLowerCase(),
					number
				);
			return (
				<Stack
					key={ record.purpose }
					render={ <li /> }
					direction="column"
					gap="sm"
					className={ `jetpack-send-setup__record is-${ state.replace( '_', '-' ) }` }
				>
					<Stack direction="row" align="center" justify="space-between" gap="sm">
						<Stack direction="row" align="center" gap="sm" className="jetpack-send-setup__grow">
							<span className="jetpack-send-setup__row-icon">
								<Icon icon={ rowIcon( state ) } />
							</span>
							<Text variant="body-lg">{ rowPurposeLabel( record.purpose ) }</Text>
							<Text
								variant="body-md"
								className="jetpack-send-setup__weak jetpack-send-setup__nowrap"
							>
								{ sprintf(
									/* translators: %s: record type, e.g. TXT or CNAME. */
									__( '%s record', 'jetpack-send-pkg' ),
									record.type
								) }
							</Text>
						</Stack>
						{ badge && (
							<Badge intent={ badge.intent } className="jetpack-send-setup__header-end">
								{ badge.label }
							</Badge>
						) }
					</Stack>
					<dl className="jetpack-send-setup__fields">
						<FieldLine
							label={ provider.fieldLabels.host }
							value={ host }
							blank={ host === '' }
							copyLabel={ copyLabel( provider.fieldLabels.host ) }
							onCopy={ onCopy }
						/>
						<FieldLine
							label={ value }
							value={ record.value }
							display={ long ? truncateValue( record.value ) : undefined }
							copyText={ copyValue( record, provider ) }
							copyLabel={ copyLabel( value ) }
							onCopy={ onCopy }
						/>
					</dl>
					{ note && (
						<Text variant="body-md" render={ <p /> } className="jetpack-send-setup__weak">
							{ note }
						</Text>
					) }
					{ record.mergedFrom && (
						<Text variant="body-md" className="jetpack-send-setup__weak">
							{ record.purpose === 'lockdown'
								? __(
										'Your domain already has this record from your host. Edit it to add Jetpack. Don’t replace it.',
										'jetpack-send-pkg'
									)
								: __(
										'Your domain already has one of these. Edit it, don’t add a second one.',
										'jetpack-send-pkg'
									) }
						</Text>
					) }
				</Stack>
			);
		} ) }
	</ul>
);

export default RecordRows;
