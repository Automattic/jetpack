import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import { useSiteSuffix } from '../../hooks/use-connection';
import { useSiteSizeQuery } from '../../hooks/use-site-size';
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
 * Both msgids are legacy's, character for character — including the
 * unusual `%1.1f`/`%2f` spelling, which is not positional despite reading
 * as though it were: those are sprintf *widths*, and the arguments are
 * consumed in order. Keeping them identical is the point, so the strings
 * arrive already translated rather than waiting a GlotPress cycle.
 *
 * @param storageUsed  - Bytes of backup storage in use.
 * @param storageLimit - The plan's storage limit in bytes.
 * @return The reading, with the used figure emphasized.
 */
function usageText( storageUsed: number, storageLimit: number ): ReactNode {
	const usedGigabytes = storageUsed / GIGABYTE;

	if ( storageLimit < TERABYTE ) {
		// translators: Must use unit abbreviation; describes used vs available storage amounts (e.g. 20.0GB of 30GB used, 0.5GB of 20GB used). %1.1f: numeric amount of disk space used, %2f: numeric amount of disk space available.
		const inGigabytes = __( 'Using <strong>%1.1fGB</strong> of %2fGB', 'jetpack-backup-pkg' );

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
};

/**
 * The two readings that sit beneath the storage meter.
 *
 * The bar says how full; these say how full *of what*, and how much
 * history that has bought — which is the figure someone weighing an
 * upgrade actually needs. Rendered only by the section's `hasUsableFigures`
 * branch, so both byte figures are known numbers by the time they arrive
 * here and neither needs re-testing.
 *
 * Legacy's copy of this also hosts the storage help popover. That is
 * JETPACK-2332 and deliberately absent, along with the Tracks event its
 * purchase link fires — there is no Tracks client on the modernized page
 * yet (JETPACK-2301). Legacy's own orchestrator never passes the
 * `onClickedPurchase` prop either, so nothing is lost in the meantime.
 *
 * @param props              - Component props.
 * @param props.storageUsed  - Bytes of backup storage in use.
 * @param props.storageLimit - The plan's storage limit in bytes.
 * @return The rendered readings.
 */
export default function StorageUsageDetails( { storageUsed, storageLimit }: Props ) {
	const site = useSiteSuffix();
	const sizeQuery = useSiteSizeQuery();

	// Read straight off the shared `/size` query rather than through
	// `useStorageUsage()`: one field for one caller does not justify
	// widening that hook's return, and React Query serves both observers
	// from the single request either way. The `ok` gate is the same one it
	// applies — WordPress.com's success flag lives *inside* a 200 body, and
	// without it the sibling fields carry no meaning.
	const size = sizeQuery.data?.ok ? sizeQuery.data : null;
	const daysOfBackupsSaved = size?.days_of_backups_saved ?? null;

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
