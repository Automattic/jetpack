import { Text, ThemeProvider } from '@automattic/jetpack-components';
import { Button, Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, share } from '@wordpress/icons';
import { useCallback } from 'react';
import { ShareButtons } from '../share-buttons/share-buttons';
import styles from './styles.module.scss';

const OneClickSharingDropdown = ( {
	className: containerClass,
	isOpen,
	onClickLearnMore,
	toggleDropdown,
} ) => {
	const renderToggle = useCallback( ( { isOpen: isExpanded, onToggle } ) => {
		return <Icon icon={ share } onClick={ onToggle } aria-expanded={ isExpanded } />;
	}, [] );

	const renderContent = useCallback(
		( { onToggle } ) => {
			return (
				<div className="one-click-sharing-dropdown">
					<ThemeProvider>
						<ShareButtons buttonStyle="icon-text" />
						<hr className={ styles.divider } />
						<Text className={ styles.description } variant="body-small">
							{ __( 'Share with a Single Click!', 'jetpack' ) +
								'✨ ' +
								__(
									"Just tap the Social icons or the 'Copy to Clipboard' icon, and we'll format your content for sharing.",
									'jetpack'
								) }
							&nbsp;
							<Button
								variant="link"
								onClick={ () => {
									onClickLearnMore();
									// Close the dropdown
									onToggle( false );
								} }
							>
								{ __( 'Learn more..', 'jetpack' ) }
							</Button>
						</Text>
					</ThemeProvider>
				</div>
			);
		},
		[ onClickLearnMore ]
	);

	console.log( { isOpen, toggleDropdown } );
	return (
		<>
			<Dropdown
				// onToggle={ toggleDropdown }
				open={ isOpen }
				focusOnMount={ true }
				contentClassName={ styles.content }
				className={ containerClass }
				popoverProps={ { placement: 'bottom-start' } }
				renderToggle={ renderToggle }
				renderContent={ renderContent }
			/>
		</>
	);
};

export default OneClickSharingDropdown;
