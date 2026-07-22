/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { RowsCsvDownloadButton, type RowsCsvDownloadButtonProps } from './rows-csv-download-button';

export type ReportCsvActionProps< Row > = Pick<
	RowsCsvDownloadButtonProps< Row >,
	'columns' | 'rows' | 'filename'
>;

/**
 * Standard CSV download action for report page headers.
 *
 * @param props - Loaded-row CSV data.
 * @return The report header download action.
 */
export function ReportCsvAction< Row >( props: ReportCsvActionProps< Row > ) {
	return (
		<RowsCsvDownloadButton
			label={ __( 'Download', 'jetpack-premium-analytics' ) }
			variant="solid"
			showIcon={ false }
			{ ...props }
		/>
	);
}
