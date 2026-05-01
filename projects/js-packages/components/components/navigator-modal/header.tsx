import { Button, useNavigator } from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight, close } from '@wordpress/icons';
import { useCallback, useContext } from 'react';
import { NavigatorModalContext } from './context.ts';

export type HeaderProps = {
	/**
	 * The title of the header.
	 */
	title: string;
	/**
	 * Whether the screen is locked, in which case to hide the back button.
	 */
	isScreenLocked?: boolean;
	/**
	 * Optional icon to display in the header.
	 */
	icon?: React.ReactNode;
	/**
	 * Optional callback to run before navigating back.
	 */
	onGoBack?: VoidFunction;
	/**
	 * Optional callback to run before closing the modal.
	 */
	onClose?: VoidFunction;
};

/**
 * Renders a header for the NavigatorModal.
 * @param {HeaderProps} props - Props
 *
 * @return component
 */
export function Header( {
	icon,
	title,
	isScreenLocked,
	onGoBack: onGoBackProp,
	onClose: onCloseProp,
}: HeaderProps ) {
	const context = useContext( NavigatorModalContext );
	const navigator = useNavigator();

	const onGoBack = useCallback( () => {
		onGoBackProp?.();
		navigator.goBack();
	}, [ navigator, onGoBackProp ] );

	const onCloseModal = useCallback( () => {
		onCloseProp?.();
		context.onClose?.();
	}, [ onCloseProp, context ] );

	return (
		<div className="jp-navigator-modal__header">
			<div className="jp-navigator-modal__title-wrap">
				{ ! isScreenLocked ? (
					<Button
						label={ __( 'Go back', 'jetpack-components' ) }
						icon={ isRTL() ? chevronRight : chevronLeft }
						onClick={ onGoBack }
						variant="tertiary"
						size="compact"
					/>
				) : null }
				{ icon }
				<h1>{ title }</h1>
			</div>
			{ context.isDismissible ? (
				<Button
					size="compact"
					onClick={ onCloseModal }
					icon={ close }
					label={ __( 'Close', 'jetpack-components' ) }
					variant="tertiary"
				/>
			) : null }
		</div>
	);
}
