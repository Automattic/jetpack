/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { download } from '@wordpress/icons';
import { Button, Icon, Notice } from '@wordpress/ui';
import clsx from 'clsx';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './download-csv-button.module.scss';

export type CsvDownloadButtonProps = {
	/**
	 * Starts the download.
	 */
	onDownload: () => Promise< unknown > | void;

	/**
	 * Visible label. Defaults to "Download CSV".
	 */
	label?: string;

	/**
	 * Optional class for layout tweaks.
	 */
	className?: string;
};

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
 * Shared CSV download action with loading and local error states.
 *
 * @param props            - Component props.
 * @param props.onDownload - Download behavior supplied by the caller.
 * @param props.label      - Optional visible label.
 * @param props.className  - Optional additional class name.
 * @return The rendered download action.
 */
export function CsvDownloadButton( {
	onDownload,
	label = __( 'Download CSV', 'jetpack-premium-analytics' ),
	className,
}: CsvDownloadButtonProps ) {
	const [ isBusy, setIsBusy ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState< string | null >( null );

	const onClick = async () => {
		if ( isBusy ) {
			return;
		}

		setErrorMessage( null );
		setIsBusy( true );

		try {
			await onDownload();
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
