/**
 * External dependencies
 */
import { IconButton } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { rotateLeft } from '@wordpress/icons';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import { useNarrowPageHeader } from '../../hooks/use-narrow-page-header';
import { ResetLayoutDialog } from './reset-layout-dialog';

export type ResetLayoutActionProps = {
	/** Resets the layout on show to its default, once the reader confirms. */
	onReset: () => void | Promise< void >;
};

/**
 * The Reset to default action beside the dashboard's own Cancel and Done while
 * customizing: an icon button, as in the configurations design, that asks first.
 * A narrow header has no room for it, where `StatsOptionsMenu` offers it instead.
 *
 * @param props         - Component props.
 * @param props.onReset - Called once the reader confirms.
 * @return The button on a wide header, and its dialog while open at either width.
 */
export function ResetLayoutAction( { onReset }: ResetLayoutActionProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const open = useCallback( () => setIsOpen( true ), [] );
	const close = useCallback( () => setIsOpen( false ), [] );
	const isNarrow = useNarrowPageHeader();

	return (
		<>
			{ ! isNarrow && (
				<IconButton
					icon={ rotateLeft }
					label={ __( 'Reset to default', 'jetpack-premium-analytics-pkg' ) }
					variant="minimal"
					tone="brand"
					size="compact"
					onClick={ open }
				/>
			) }
			{ /* Outlives the button on purpose: a reader who narrows the window mid-confirmation keeps the dialog, and their place in it, rather than having it vanish and reappear on the way back out. */ }
			{ isOpen && <ResetLayoutDialog onConfirm={ onReset } onClose={ close } /> }
		</>
	);
}
