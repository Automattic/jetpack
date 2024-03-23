/**
 * External dependencies
 */

import { Button, VisuallyHidden, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import classnames from 'classnames';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import type { NoticeAction, NoticeProps } from '@wordpress/components/src/notice/types';

type NoticeButtonAction = NoticeAction & { isLoading?: boolean; isDisabled?: boolean };

const noop = () => {};

function getStatusLabel( status: NoticeProps[ 'status' ] ): string {
	switch ( status ) {
		case 'warning':
			return __( 'Warning notice', 'jetpack-my-jetpack' );
		case 'info':
			return __( 'Information notice', 'jetpack-my-jetpack' );
		case 'error':
			return __( 'Error notice', 'jetpack-my-jetpack' );
		// The default will also catch the 'success' status.
		default:
			return __( 'Notice', 'jetpack-my-jetpack' );
	}
}

function Notice( {
	className,
	status = 'info',
	children,
	onRemove = noop,
	isDismissible = true,
	actions = [],
	// onDismiss is a callback executed when the notice is dismissed.
	// It is distinct from onRemove, which _looks_ like a callback but is
	// actually the function to call to remove the notice from the UI.
	onDismiss = noop,
}: NoticeProps ): JSX.Element {
	const classes = classnames( className, 'components-notice', 'is-' + status, {
		'is-dismissible': isDismissible,
	} );

	const onDismissNotice = useCallback( () => {
		onDismiss();
		onRemove();
	}, [ onDismiss, onRemove ] );

	return (
		<div className={ classes }>
			<VisuallyHidden>{ getStatusLabel( status ) }</VisuallyHidden>
			<div className="components-notice__content">
				{ children }
				<div className="components-notice__actions">
					{ actions.map(
						(
							{
								className: buttonCustomClasses,
								label,
								variant,
								noDefaultClasses = false,
								onClick,
								url,
								isLoading = false,
								isDisabled = false,
							}: NoticeButtonAction,
							index
						) => {
							let computedVariant = variant;
							if ( variant !== 'primary' && ! noDefaultClasses ) {
								computedVariant = ! url ? 'secondary' : 'link';
							}
							if ( typeof computedVariant === 'undefined' ) {
								computedVariant = 'primary';
							}

							return (
								<Button
									key={ index }
									href={ url }
									variant={ computedVariant }
									onClick={ url ? undefined : onClick }
									className={ classnames( 'components-notice__action', buttonCustomClasses ) }
									disabled={ isLoading || isDisabled }
								>
									{ isLoading ? <Spinner /> : label }
								</Button>
							);
						}
					) }
				</div>
			</div>
			{ isDismissible && (
				<Button
					className="components-notice__dismiss"
					icon={ close }
					label={ __( 'Close', 'jetpack-my-jetpack' ) }
					onClick={ onDismissNotice }
				/>
			) }
		</div>
	);
}

export default Notice;
