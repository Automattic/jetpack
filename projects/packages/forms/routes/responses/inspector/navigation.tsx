/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronUp, chevronDown, close } from '@wordpress/icons';
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
		<div style={ { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 } }>
			<div style={ { display: 'flex', alignItems: 'center' } }>
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
						display: 'inline-block',
						width: '1px',
						height: '20px',
						backgroundColor: 'var(--wp-admin-theme-color-darker-10, #135e96)',
						opacity: 0.2,
						marginLeft: '4px',
					} }
				/>
			</div>
			<Button
				{ ...sharedProps }
				iconSize={ 20 }
				icon={ close }
				label={ __( 'Close', 'jetpack-forms' ) }
				onClick={ onClose }
			/>
		</div>
	);
}
