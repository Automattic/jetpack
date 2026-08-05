/**
 * External dependencies
 */
import { Button } from '@jetpack-premium-analytics/externals';
import { useRegistry } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { download } from '@wordpress/icons';
import clsx from 'clsx';
import { useState, type ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import styles from './csv-download-button.module.scss';

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

	/**
	 * Button treatment. Defaults to the compact, minimal widget action.
	 */
	variant?: ComponentProps< typeof Button >[ 'variant' ];

	/**
	 * Whether to show the download icon. Defaults to true.
	 */
	showIcon?: boolean;
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

	return __( 'Could not download report.', 'jetpack-premium-analytics-pkg' );
}

/**
 * Shared CSV download action with loading state and snackbar errors.
 *
 * @param props            - Component props.
 * @param props.onDownload - Download behavior supplied by the caller.
 * @param props.label      - Optional visible label.
 * @param props.className  - Optional additional class name.
 * @param props.variant    - Optional button treatment.
 * @param props.showIcon   - Whether to render the download icon.
 * @return The rendered download action.
 */
export function CsvDownloadButton( {
	onDownload,
	label = __( 'Download CSV', 'jetpack-premium-analytics-pkg' ),
	className,
	variant = 'minimal',
	showIcon = true,
}: CsvDownloadButtonProps ) {
	const [ isBusy, setIsBusy ] = useState( false );
	const registry = useRegistry();

	const onClick = async () => {
		if ( isBusy ) {
			return;
		}

		setIsBusy( true );

		try {
			await onDownload();
		} catch ( error ) {
			registry.dispatch( 'core/notices' ).createErrorNotice( getErrorMessage( error ), {
				type: 'snackbar',
				explicitDismiss: true,
			} );
		} finally {
			setIsBusy( false );
		}
	};

	return (
		<Button
			variant={ variant }
			tone="neutral"
			size="compact"
			onClick={ onClick }
			loading={ isBusy }
			className={ clsx( styles.downloadCsv, className ) }
		>
			{ showIcon ? <Button.Icon icon={ download } /> : null }
			<span className={ styles.label }>{ label }</span>
		</Button>
	);
}
