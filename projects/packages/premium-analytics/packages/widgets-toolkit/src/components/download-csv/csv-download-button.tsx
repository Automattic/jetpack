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
	onDownload: () => Promise< unknown > | void;

	/**
	 * Visible label. Defaults to "Download CSV".
	 */
	label?: string;

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
