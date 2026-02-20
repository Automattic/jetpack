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
};

/**
 * Renders a header for the NavigatorModal.
 * @param {HeaderProps} props - Props
 *
 * @return component
 */
export function Header( { icon, title, isScreenLocked }: HeaderProps ) {
	const context = useContext( NavigatorModalContext );
	const navigator = useNavigator();

	const onGoBack = useCallback( () => {
		navigator.goBack();
	}, [ navigator ] );

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
					onClick={ context.onClose }
					icon={ close }
					label={ __( 'Close', 'jetpack-components' ) }
					variant="tertiary"
				/>
			) : null }
		</div>
	);
}
