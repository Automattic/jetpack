import { Button, useNavigator } from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight, close } from '@wordpress/icons';
import { useCallback, useContext } from 'react';
import { NavigatorModalContext } from './context.ts';
import styles from './styles.module.scss';

export type HeaderProps = {
	/**
	 * The title of the header.
	 */
	title: string;
	/**
	 * Whether the screen is locked, in which case to hide the back button.
	 */
	isScreenLocked?: boolean;
};

/**
 * Renders a header for the NavigatorModal.
 * @param {HeaderProps} props - Props
 *
 * @return component
 */
export function Header( { title, isScreenLocked }: HeaderProps ) {
	const context = useContext( NavigatorModalContext );
	const navigator = useNavigator();

	const onGoBack = useCallback( () => {
		navigator.goBack();
	}, [ navigator ] );

	return (
		<div className={ styles.header }>
			<div className={ styles[ 'title-wrap' ] }>
				{ ! isScreenLocked ? (
					<Button
						label={ __( 'Go back', 'jetpack-components' ) }
						icon={ isRTL() ? chevronRight : chevronLeft }
						onClick={ onGoBack }
						variant="tertiary"
						size="compact"
					/>
				) : null }
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
