/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { download } from '@wordpress/icons';
import { Button, Icon } from '@wordpress/ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { buildCsv, saveCsv, type CsvColumn } from '../../helpers/build-csv';
import styles from './download-csv-button.module.scss';

export type DownloadCsvButtonProps< Row extends Record< string, unknown > > = {
	/**
	 * Column definitions driving the header and cell order.
	 */
	columns: CsvColumn< Row >[];

	/**
	 * Rows already loaded in the browser to serialize.
	 */
	rows: Row[];

	/**
	 * File name (without extension) for the download.
	 */
	filename: string;

	/**
	 * Visible label. Defaults to "Download CSV".
	 */
	label?: string;

	/**
	 * Optional class for layout tweaks.
	 */
	className?: string;
};

/**
 * A "Download CSV" action that serializes already-loaded rows and saves them
 * client-side, mirroring the Jetpack Stats report export. Renders nothing when
 * there are no rows to export.
 *
 * @param props           - Component props.
 * @param props.columns   - Column definitions.
 * @param props.rows      - Rows to serialize.
 * @param props.filename  - Download file name (without extension).
 * @param props.label     - Optional visible label.
 * @param props.className - Optional additional class name.
 * @return The rendered action, or null when there is nothing to export.
 */
export function DownloadCsvButton< Row extends Record< string, unknown > >( {
	columns,
	rows,
	filename,
	label = __( 'Download CSV', 'jetpack-premium-analytics' ),
	className,
}: DownloadCsvButtonProps< Row > ) {
	if ( rows.length === 0 ) {
		return null;
	}

	const onClick = () => saveCsv( filename, buildCsv( columns, rows ) );

	return (
		<Button
			variant="unstyled"
			onClick={ onClick }
			className={ clsx( styles.downloadCsv, className ) }
		>
			<Icon icon={ download } size={ 20 } className={ styles.icon } />
			<span className={ styles.label }>{ label }</span>
		</Button>
	);
}
