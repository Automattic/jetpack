import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import { useSiteSuffix } from '../../hooks/use-connection';
import type { ReactNode } from 'react';

// Binary multiples, as legacy spells them. WordPress.com reports these
// figures in bytes and sells storage in powers of two, so a 10GB plan is
// 10 * 2^30 bytes — dividing by 10^9 would advertise it back to the reader
// as 10.7GB.
const GIGABYTE = 2 ** 30;
const TERABYTE = 2 ** 40;

/**
 * The "Using 12.4GB of 20GB" reading.
 *
 * Usage is always stated in gigabytes and only the limit switches unit,
 * at 1TB — which is what the larger storage add-ons are sold in. A site
 * that has filled whole terabytes is vanishingly rare, and "0.01TB used"
 * would answer a question nobody asked.
 *
 * Both msgids are legacy's, character for character, so the strings
 * arrive already translated rather than waiting a GlotPress cycle. That
 * carries a known defect across with them, and it is worth being precise
 * about which one.
 *
 * The gigabyte msgid's `%1.1f` and `%2f` are *not* argument references,
 * despite reading as though they were. They parse as a width and a
 * precision, and `@tannin/sprintf` — which is what `@wordpress/i18n` uses —
 * annotates the width group "Min width (unsupported)" and discards it. So
 * both are plain sequential placeholders, consumed in the order they
 * appear, and the English source renders correctly at every limit:
 * `sprintf( 'Using <strong>%1.1fGB</strong> of %2fGB', 3, 5 )` gives
 * `Using <strong>3.0GB</strong> of 5GB`, with no padding and no stray
 * space.
 *
 * The hazard is not the rendering, it is the reordering. Being sequential,
 * the two values swap places if a translation fronts the total — which is
 * natural in plenty of languages: `sprintf( 'Of %2fGB, using
 * <strong>%1.1fGB</strong>', 12.4, 20 )` gives `Of 12.4GB, using 20.0GB`,
 * used and total transposed. On the one screen whose job is to say whether
 * backups are at risk, that tells the reader they are over quota when they
 * are not. Truly positional placeholders survive the same reorder, which is
 * why the terabyte msgid below — spelled `%1$d`/`%2$d` — is immune.
 *
 * Fixing the gigabyte string means changing legacy and this copy together
 * so the msgid stays shared, and that is queued as its own change rather
 * than done here. Until it lands, the translator comment on the string
 * must not describe these as numbered arguments, or it invites exactly the
 * reorder that breaks them.
 *
 * @param storageUsed  - Bytes of backup storage in use.
 * @param storageLimit - The plan's storage limit in bytes.
 * @return The reading, with the used figure emphasized.
 */
function usageText( storageUsed: number, storageLimit: number ): ReactNode {
	const usedGigabytes = storageUsed / GIGABYTE;

	if ( storageLimit < TERABYTE ) {
		// translators: Must use unit abbreviation; describes used vs available storage amounts (e.g. 20.0GB of 30GB used, 0.5GB of 20GB used). %1.1f and %2f are NOT numbered arguments — they are filled in the order they appear, %1.1f first with the amount of disk space used, then %2f with the amount available. Please keep them in that order.
		const inGigabytes = __( 'Using <strong>%1.1fGB</strong> of %2fGB', 'jetpack-backup-pkg' );

		// Legacy carries `eslint-disable-next-line @wordpress/valid-sprintf`
		// on its copy of this call, and its absence here is not a clean
		// bill of health: the rule only inspects a format string it can
		// resolve, and hoisting the msgid into a `const` — which the
		// minifier reasoning above requires — puts it out of reach. The
		// string is exactly as malformed as it was; nothing is checking it
		// any more. See the note on this function about what that costs.
		return createInterpolateElement(
			sprintf(
				inGigabytes,
				// @ts-expect-error The format string is parsed at the type level, and this spelling defeats that parser — it infers a single argument.
				usedGigabytes,
				storageLimit / GIGABYTE
			),
			{ strong: <strong /> }
		);
	}

	// translators: Must use unit abbreviation; describes used vs available storage amounts (e.g. 20.0GB of 1TB used, 0.5GB of 2TB used). %1$d: numeric amount of disk space used, %2$d: numeric amount of disk space available.
	const inTerabytes = __( 'Using <strong>%1$dGB</strong> of %2$dTB', 'jetpack-backup-pkg' );

	return createInterpolateElement( sprintf( inTerabytes, usedGigabytes, storageLimit / TERABYTE ), {
		strong: <strong />,
	} );
}

/**
 * The "N days of backups saved" label, still carrying its `<a>` markup.
 *
 * Two singular `__()` msgids rather than one `_n()` pair, which is what
 * legacy ships. `_n()` would be the better i18n — it is the only form
 * that serves a language with more than two plural rules — but it is a
 * different GlotPress entry from either of these, so adopting it here
 * would throw away every existing translation of a string the flag-off
 * dashboard is still rendering today. Worth revisiting once legacy's copy
 * is gone and both can change together.
 *
 * Note the ternary picks between two already-extracted `const`s rather
 * than wrapping the `__()` call itself. Put the choice inside the call and
 * the minifier factors it out; the text-domain scanner then finds no
 * literal to extract and drops both msgids without saying so.
 *
 * @param days - Days of backups WordPress.com is actually holding.
 * @return The label, for `createInterpolateElement`.
 */
function daysOfBackupsLabel( days: number ): string {
	const singular = __( '<a>1 day of backups saved</a>', 'jetpack-backup-pkg' );
	/* translators: %s: Number of days of backups saved. */
	const plural = __( '<a>%s days of backups saved</a>', 'jetpack-backup-pkg' );

	// Stringified for the `%s` the msgid spells, which `sprintf` types as
	// taking a string. It would coerce the number itself, but only after
	// the type-level parse of the format string has already rejected it.
	return days === 1 ? singular : sprintf( plural, String( days ) );
}

type Props = {
	storageUsed: number;
	storageLimit: number;
	daysOfBackupsSaved: number | null;
};

/**
 * The two readings that sit beneath the storage meter.
 *
 * The bar says how full; these say how full *of what*, and how much
 * history that has bought — which is the figure someone weighing an
 * upgrade actually needs.
 *
 * Presentational, like `meter.tsx`: everything arrives as a prop, read
 * once by the section from `useStorageUsage()`. Rendered only by that
 * section's `hasUsableFigures` branch, so both byte figures are known
 * numbers by the time they get here and neither needs re-testing.
 *
 * Legacy's copy of this also hosts the storage help popover. That is
 * JETPACK-2332 and deliberately absent, along with the Tracks event its
 * purchase link fires — there is no Tracks client on the modernized page
 * yet (JETPACK-2301). Legacy's own orchestrator never passes the
 * `onClickedPurchase` prop either, so nothing is lost in the meantime.
 *
 * @param props                    - Component props.
 * @param props.storageUsed        - Bytes of backup storage in use.
 * @param props.storageLimit       - The plan's storage limit in bytes.
 * @param props.daysOfBackupsSaved - Days of history held, or null when unreported.
 * @return The rendered readings.
 */
export default function StorageUsageDetails( {
	storageUsed,
	storageLimit,
	daysOfBackupsSaved,
}: Props ) {
	const site = useSiteSuffix();

	// The key is omitted rather than passed as undefined. `getRedirectUrl`
	// walks its args with `for…in`, so a present-but-undefined `site` is
	// encoded — the link would carry the literal string `undefined` — and
	// its mere presence also suppresses the helper's own site fallback.
	const backupsSavedUrl = getRedirectUrl(
		'backup-plugin-storage-backups-saved',
		site ? { site } : {}
	);

	return (
		<Stack
			className="jpb-storage-space__details"
			direction="row"
			justify="space-between"
			align="baseline"
			// No breakpoint and no media query: `Stack` writes its flex
			// properties as inline styles, so a responsive override would
			// have to reach for `!important`. Letting the row wrap gets the
			// same result — a single item on the second line sits at the
			// start under `space-between`, which is exactly the stacked
			// layout legacy switches to on phones, at legacy's 4px gap.
			wrap="wrap"
			gap="xs"
		>
			<Text variant="body-md">{ usageText( storageUsed, storageLimit ) }</Text>
			{ /*
			 * Omitted rather than shown as "0 days" when the count is
			 * missing. Legacy renders the plural label over its selector's
			 * `null` and prints "null days of backups saved"; it only gets
			 * away with it because a response complete enough to draw the
			 * meter has always carried this field too. Saying nothing is
			 * the honest answer if that ever stops being true.
			 */ }
			{ daysOfBackupsSaved !== null && (
				<Text variant="body-sm">
					{ createInterpolateElement( daysOfBackupsLabel( daysOfBackupsSaved ), {
						a: <Link openInNewTab href={ backupsSavedUrl } />,
					} ) }
				</Text>
			) }
		</Stack>
	);
}
