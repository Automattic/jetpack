/**
 * External dependencies
 */

import { Button, VisuallyHidden, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import classnames from 'classnames';
import { useCallback } from 'react';
import type { NoticeAction, NoticeProps } from '@wordpress/components/src/notice/types';
import type { ReactNode, Component } from 'react';

import './styles.scss';

type NoticeButtonAction = NoticeAction & { isLoading?: boolean; isDisabled?: boolean };

type MyJetpackNoticeProps = NoticeProps & {
	isRedBubble: boolean;
};

const noop = () => {};

/**
 *	Returns the label for the notice based on the status.
 *
 * @param {string} status - The status of the notice.
 *
 * @returns {string} The label based on the status.
 */
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

/**
 * Notice component based on the one from @wordpress/components.
 *
 * @param {object} props                   - The properties.
 * @param {string} props.className         - The class name.
 * @param {string} props.status            - The message status: 'warning' | 'success' | 'error' | 'info'.
 * @param {ReactNode} props.children - Children element
 * @param {Function} props.onRemove        - The function to call when the notice is removed.
 * @param {boolean} props.isDismissible    - Whether the notice can be dismissed.
 * @param {boolean} props.isRedBubble      - Whether the notice is tied to the red bubble notification.
 * @param {Array} props.actions            - An array of actions (buttons) to display in the notice.
 * @param {Function} props.onDismiss       - The function to call when the notice is dismissed.
 *
 * @returns {Component} The `Notice` component.
 */
function Notice( {
	className,
	status = 'info',
	children,
	onRemove = noop,
	isDismissible = true,
	isRedBubble = false,
	actions = [],
	// onDismiss is a callback executed when the notice is dismissed.
	// It is distinct from onRemove, which _looks_ like a callback but is
	// actually the function to call to remove the notice from the UI.
	onDismiss = noop,
}: MyJetpackNoticeProps ) {
	const classes = classnames( className, 'components-notice', 'is-' + status, {
		'is-dismissible': isDismissible,
		'is-red-bubble': isRedBubble,
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
