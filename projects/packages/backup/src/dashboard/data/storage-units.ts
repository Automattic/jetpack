import { formatNumber } from '@automattic/number-formatters';
import { _x, sprintf } from '@wordpress/i18n';

// Binary multiples, as legacy spells them. WordPress.com reports these
// figures in bytes and sells storage in powers of two, so a 10GB plan is
// 10 * 2^30 bytes — dividing by 10^9 would advertise it back to the reader
// as 10.7GB.
export const MEGABYTE = 2 ** 20;
export const GIGABYTE = 2 ** 30;
export const TERABYTE = 2 ** 40;

/**
 * A byte count in the units storage is sold in, e.g. `12.4GB` or `1.5TB`; MB below 1GB.
 *
 * @param bytes - The amount.
 * @return The amount, abbreviated as legacy does.
 */
export function formatStorageSize( bytes: number ): string {
	const options = { numberFormatOptions: { maximumFractionDigits: 1 } };

	if ( bytes < GIGABYTE ) {
		return sprintf(
			/* translators: %s: a storage size number, e.g. "512". */
			_x( '%sMB', 'storage size in megabytes', 'jetpack-backup-pkg' ),
			formatNumber( bytes / MEGABYTE )
		);
	}

	return bytes >= TERABYTE
		? sprintf(
				/* translators: %s: a storage size number, e.g. "1.5". */
				_x( '%sTB', 'storage size in terabytes', 'jetpack-backup-pkg' ),
				formatNumber( bytes / TERABYTE, options )
			)
		: sprintf(
				/* translators: %s: a storage size number, e.g. "12.4". */
				_x( '%sGB', 'storage size in gigabytes', 'jetpack-backup-pkg' ),
				formatNumber( bytes / GIGABYTE, options )
			);
}
