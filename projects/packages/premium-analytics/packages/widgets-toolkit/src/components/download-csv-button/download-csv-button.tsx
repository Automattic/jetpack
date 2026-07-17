/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import {
	downloadReport,
	hasComparisonEnabled,
	type ReportParams,
} from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
import { download } from '@wordpress/icons';
import { Button, Icon, Notice } from '@wordpress/ui';
import clsx from 'clsx';
import { useContext, useState } from 'react';
/**
 * Internal dependencies
 */
import { buildCsv, saveCsv, type CsvColumn } from '../../helpers/build-csv';
import { WidgetRootContext } from '../widget-root';
import styles from './download-csv-button.module.scss';

type CommonDownloadCsvButtonProps = {
	/**
	 * Visible label. Defaults to "Download CSV".
	 */
	label?: string;

	/**
	 * Optional class for layout tweaks.
	 */
	className?: string;
};

type ServerDownloadCsvButtonProps = CommonDownloadCsvButtonProps & {
	/**
	 * A report key supported by the ported WooCommerce Analytics export endpoint.
	 * When set, the endpoint generates the complete CSV for the report period.
	 */
	reportType: string;

	/**
	 * Optional report parameters. Defaults to the surrounding WidgetRoot context.
	 */
	reportParams?: ReportParams;

	columns?: never;
	rows?: never;
	filename?: never;
};

type ClientDownloadCsvButtonProps< Row extends Record< string, unknown > > =
	CommonDownloadCsvButtonProps & {
		reportType?: never;
		reportParams?: never;

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
	};

export type DownloadCsvButtonProps<
	Row extends Record< string, unknown > = Record< string, unknown >,
> = ServerDownloadCsvButtonProps | ClientDownloadCsvButtonProps< Row >;

function areCsvExportsEnabled(): boolean {
	return getScriptData()?.premium_analytics?.csv_exports_enabled === true;
}

function getErrorMessage( error: unknown ): string {
	if ( error instanceof Error && error.message ) {
		return error.message;
	}
	if (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof error.message === 'string' &&
		error.message
	) {
		return error.message;
	}

	return __( 'Could not download report.', 'jetpack-premium-analytics' );
}

/**
 * A single "Download CSV" action for dashboard widgets. Reports supported by
 * the ported WooCommerce Analytics exporter use its existing download endpoint;
 * other widgets serialize rows already loaded in the browser.
 *
 * @param props              - Component props.
 * @param props.label        - Optional visible label.
 * @param props.className    - Optional additional class name.
 * @param props.reportType   - Optional server-supported report key.
 * @param props.reportParams - Optional report params override.
 * @param props.columns      - Client-side column definitions.
 * @param props.rows         - Client-side rows to serialize.
 * @param props.filename     - Client-side download file name.
 * @return The rendered action, or null when there is nothing to export.
 */
export function DownloadCsvButton<
	Row extends Record< string, unknown > = Record< string, unknown >,
>( props: DownloadCsvButtonProps< Row > ) {
	const context = useContext( WidgetRootContext );
	const [ isBusy, setIsBusy ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState< string | null >( null );
	const { label = __( 'Download CSV', 'jetpack-premium-analytics' ), className } = props;
	const isServerMode = props.reportType !== undefined;

	if ( ! areCsvExportsEnabled() || ( ! isServerMode && props.rows.length === 0 ) ) {
		return null;
	}

	const reportParams = isServerMode ? props.reportParams ?? context?.reportParams : undefined;
	if ( isServerMode && ! reportParams ) {
		if ( process.env.NODE_ENV !== 'production' ) {
			// eslint-disable-next-line no-console -- Surface a developer integration error without taking down the widget.
			console.warn(
				'DownloadCsvButton server mode requires reportParams or a surrounding WidgetRoot.'
			);
		}
		return null;
	}

	const onClick = async () => {
		if ( isBusy ) {
			return;
		}

		setErrorMessage( null );
		setIsBusy( true );

		try {
			if ( isServerMode ) {
				const { reportType } = props;
				const resolvedReportParams = reportParams;

				await downloadReport( {
					reportType,
					from: resolvedReportParams.from,
					to: resolvedReportParams.to,
					interval: resolvedReportParams.interval,
					...( resolvedReportParams.date_type ? { dateType: resolvedReportParams.date_type } : {} ),
					...( hasComparisonEnabled( resolvedReportParams )
						? {
								compareFrom: resolvedReportParams.compare_from,
								compareTo: resolvedReportParams.compare_to,
						  }
						: {} ),
				} );
				return;
			}

			// Let React commit the disabled state before the synchronous CSV build
			// and browser download handoff begin.
			await new Promise< void >( resolve => setTimeout( resolve, 0 ) );
			saveCsv( props.filename, buildCsv( props.columns, props.rows ) );
		} catch ( error ) {
			setErrorMessage( getErrorMessage( error ) );
		} finally {
			setIsBusy( false );
		}
	};

	return (
		<>
			{ errorMessage && (
				<Notice.Root intent="error" spokenMessage={ errorMessage }>
					<Notice.Description>{ errorMessage }</Notice.Description>
					<Notice.CloseIcon
						label={ __( 'Dismiss', 'jetpack-premium-analytics' ) }
						onClick={ () => setErrorMessage( null ) }
					/>
				</Notice.Root>
			) }
			<Button
				variant="minimal"
				tone="neutral"
				size="compact"
				onClick={ onClick }
				loading={ isBusy }
				className={ clsx( styles.downloadCsv, className ) }
			>
				<Icon icon={ download } size={ 20 } className={ styles.icon } />
				<span className={ styles.label }>{ label }</span>
			</Button>
		</>
	);
}
