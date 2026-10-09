import { formatNumber } from '@automattic/number-formatters';

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
		return `${ formatNumber( bytes / MEGABYTE ) }MB`;
	}

	return bytes >= TERABYTE
		? `${ formatNumber( bytes / TERABYTE, options ) }TB`
		: `${ formatNumber( bytes / GIGABYTE, options ) }GB`;
}
