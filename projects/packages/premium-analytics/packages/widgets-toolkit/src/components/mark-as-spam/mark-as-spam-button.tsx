/**
 * External dependencies
 */
import { AlertDialog, Button, Icon, Tooltip } from '@jetpack-premium-analytics/externals';
import { __, sprintf } from '@wordpress/i18n';
import { caution } from '@wordpress/icons';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './mark-as-spam-button.module.scss';
import type { JSX } from 'react';

export type MarkAsSpamButtonProps = {
	/** The referrer domain the button marks. */
	domain: string;
	/** Marks the domain once the reader confirms; see `useMarkAsSpam()`. */
	onConfirm: ( domain: string ) => Promise< void >;
	className?: string;
};

/**
 * The "Mark as spam" action of a referrer row in a widget: an icon-only button
 * that asks for confirmation, as the Referrers report's row action does.
 *
 * @return The button and its dialog.
 */
export function MarkAsSpamButton( {
	domain,
	onConfirm,
	className,
}: MarkAsSpamButtonProps ): JSX.Element {
	const [ isOpen, setIsOpen ] = useState( false );
	const open = useCallback( () => setIsOpen( true ), [] );
	const confirm = useCallback( () => onConfirm( domain ), [ onConfirm, domain ] );

	return (
		<>
			<Tooltip.Root>
				<Tooltip.Trigger
					render={
						<Button
							variant="unstyled"
							size="compact"
							className={ clsx( styles.button, className ) }
							onClick={ open }
							aria-label={ sprintf(
								/* translators: %s: the referring site's name, such as "example.com". */
								__( 'Mark "%s" as spam', 'jetpack-premium-analytics-pkg' ),
								domain
							) }
						>
							<Icon icon={ caution } size={ 16 } />
						</Button>
					}
				/>
				<Tooltip.Popup>{ __( 'Mark as spam', 'jetpack-premium-analytics-pkg' ) }</Tooltip.Popup>
			</Tooltip.Root>
			<AlertDialog.Root open={ isOpen } onOpenChange={ setIsOpen } onConfirm={ confirm }>
				<AlertDialog.Popup
					title={ __( 'Mark as spam', 'jetpack-premium-analytics-pkg' ) }
					description={ sprintf(
						// translators: %s: The referrer domain, e.g. example.com.
						__( 'Are you sure you want to mark "%s" as spam?', 'jetpack-premium-analytics-pkg' ),
						domain
					) }
					confirmButtonText={ __( 'Mark as spam', 'jetpack-premium-analytics-pkg' ) }
				/>
			</AlertDialog.Root>
		</>
	);
}
