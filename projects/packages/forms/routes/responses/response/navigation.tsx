/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronUp, chevronDown, close } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import * as React from 'react';

/**
 * Renders the navigation for a response.
 *
 * @param props             - Props used while rendering the navigation for a response.
 * @param props.hasNext     - Whether there is a next response.
 * @param props.hasPrevious - Whether there is a previous response.
 * @param props.onNext      - Callback fired when the next response is clicked.
 * @param props.onPrevious  - Callback fired when the previous response is clicked.
 * @param props.onClose     - Callback fired when the navigation is closed.
 *
 * @return                  - Element containing the navigation for a response.
 */
export function ResponseNavigation( {
	hasNext,
	hasPrevious,
	onNext,
	onPrevious,
	onClose,
}: {
	hasNext: boolean;
	hasPrevious: boolean;
	onNext: () => void;
	onPrevious: () => void;
	onClose: () => void;
} ) {
	const sharedProps = {
		accessibleWhenDisabled: true,
		iconSize: 24,
		showTooltip: true,
		size: 'compact' as const,
	};

	return (
		<Stack direction="row" gap="xs" justify="end" style={ { flexShrink: 0 } } wrap="wrap">
			<Button
				{ ...sharedProps }
				disabled={ ! hasPrevious }
				icon={ chevronUp }
				label={ __( 'Previous', 'jetpack-forms' ) }
				onClick={ onPrevious }
			/>
			<Button
				{ ...sharedProps }
				disabled={ ! hasNext }
				icon={ chevronDown }
				label={ __( 'Next', 'jetpack-forms' ) }
				onClick={ onNext }
			/>
			<span
				style={ {
					backgroundColor: 'var(--wp-admin-theme-color-darker-10, #135e96)',
					display: 'inline-block',
					height: '20px',
					margin: '6px 4px 6px 0',
					opacity: 0.2,
					width: '1px',
				} }
			/>
			<Button
				{ ...sharedProps }
				iconSize={ 20 }
				icon={ close }
				label={ __( 'Close', 'jetpack-forms' ) }
				onClick={ onClose }
			/>
		</Stack>
	);
}
