/**
 * External dependencies
 */
import { IconButton } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { reset } from '@wordpress/icons';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import { ResetLayoutDialog } from './reset-layout-dialog';

export type ResetLayoutActionProps = {
	/** Resets the layout on show to its default, once the reader confirms. */
	onReset: () => void | Promise< void >;
};

/**
 * The Reset to default action beside the dashboard's own Cancel and Done while
 * customizing: an icon button, as in the configurations design, that asks first.
 *
 * @param props         - Component props.
 * @param props.onReset - Called once the reader confirms.
 * @return The button, and its dialog while open.
 */
export function ResetLayoutAction( { onReset }: ResetLayoutActionProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const open = useCallback( () => setIsOpen( true ), [] );
	const close = useCallback( () => setIsOpen( false ), [] );

	return (
		<>
			<IconButton
				icon={ reset }
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
