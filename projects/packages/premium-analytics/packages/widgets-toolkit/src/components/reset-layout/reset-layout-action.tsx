/**
 * External dependencies
 */
import { IconButton } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { rotateLeft } from '@wordpress/icons';
import { useCallback, useEffect, useState } from 'react';
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
 * @return The button, and its dialog while open, or nothing on a narrow header.
 */
export function ResetLayoutAction( { onReset }: ResetLayoutActionProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const open = useCallback( () => setIsOpen( true ), [] );
	const close = useCallback( () => setIsOpen( false ), [] );
	const isNarrow = useNarrowPageHeader();

	// Crossing the breakpoint hands the action to the menu, so an open dialog left
	// standing would come back on the way out, or sit beside the menu's own.
	useEffect( () => {
		setIsOpen( false );
	}, [ isNarrow ] );

	if ( isNarrow ) {
		return null;
	}

	return (
		<>
			<IconButton
				icon={ rotateLeft }
				label={ __( 'Reset to default', 'jetpack-premium-analytics-pkg' ) }
				variant="minimal"
				tone="brand"
				size="compact"
				onClick={ open }
			/>
			{ isOpen && <ResetLayoutDialog onConfirm={ onReset } onClose={ close } /> }
		</>
	);
}
