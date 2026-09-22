import { useMemo, createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

const StorageUnits = {
	Gigabyte: 2 ** 30,
	Terabyte: 2 ** 40,
};

const getAppropriateStorageUnit = bytes => {
	if ( bytes < StorageUnits.Terabyte ) {
		return StorageUnits.Gigabyte;
	}

	return StorageUnits.Terabyte;
};

const bytesToUnit = ( bytes, unit ) => bytes / unit;

export const useStorageUsageText = ( bytesUsed, bytesAvailable ) => {
	return useMemo( () => {
		if ( bytesUsed === undefined ) {
			return null;
		}

		const usedGigabytes = bytesToUnit( bytesUsed, StorageUnits.Gigabyte );

		if ( bytesAvailable === undefined ) {
			// translators: Must use unit abbreviation; describes an amount of storage space in gigabytes (e.g., 15.4GB used)
			return sprintf( __( '%1$dGB used', 'jetpack-backup-pkg' ), usedGigabytes );
		}

		const availableUnit = getAppropriateStorageUnit( bytesAvailable );
		const availableUnitAmount = bytesToUnit( bytesAvailable, availableUnit );

		if ( availableUnit === StorageUnits.Gigabyte ) {
			// Positional, and it has to stay that way. `@tannin/sprintf`
			// reads a digit that is not followed by `$` as a min-width
			// specifier, discards it, and then fills the placeholders in
			// the order they appear — so the earlier `%1.1f`/`%2f` spelling
			// rendered correctly in English and transposed the two figures
			// under any translation that fronts the total, which reads as
			// "over quota" to someone who is not. The modernized copy in
			// `dashboard/components/storage-space/usage-details.tsx` shares
			// this msgid; change the two together or they become separate
			// GlotPress entries saying the same thing.
			return createInterpolateElement(
				sprintf(
					// translators: Must use unit abbreviation; describes used vs available storage amounts (e.g. 20.0GB of 30GB used, 0.5GB of 20GB used). %1$.1f: numeric amount of disk space used, %2$f: numeric amount of disk space available.
					__( 'Using <strong>%1$.1fGB</strong> of %2$fGB', 'jetpack-backup-pkg' ),
					usedGigabytes,
					availableUnitAmount
				),
				{
					strong: <strong />,
				}
			);
		}

		return createInterpolateElement(
			sprintf(
				// translators: Must use unit abbreviation; describes used vs available storage amounts (e.g. 20.0GB of 1TB used, 0.5GB of 2TB used). %1$d: numeric amount of disk space used, %2$d: numeric amount of disk space available.
				__( 'Using <strong>%1$dGB</strong> of %2$dTB', 'jetpack-backup-pkg' ),
				usedGigabytes,
				availableUnitAmount
			),
			{
				strong: <strong />,
			}
		);
	}, [ bytesUsed, bytesAvailable ] );
};
