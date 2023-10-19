import { Text, ThemeProvider, useBreakpointMatch } from '@automattic/jetpack-components';
import { Modal, ResponsiveWrapper } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ShareButtons } from '../share-buttons/share-buttons';
import background from './background.svg';
import illustration from './illustration.svg';
import styles from './styles.module.scss';

const OneClickSharingModal = ( { onClose } ) => {
	const [ isSm ] = useBreakpointMatch( 'sm' );

	return (
		<Modal className={ styles.modal } onRequestClose={ onClose }>
			<ThemeProvider>
				<div className={ styles.container }>
					<img className={ styles.background } src={ background } alt="" />

					<div className={ styles.column }>
						<Text className={ styles.title }>
							{ __( 'Introducing Simplified Sharing ', 'jetpack' ) }
						</Text>
						<Text className={ styles.description } variant="body-small">
							{ __(
								'Hey there! Quick update for you. You can now effortlessly share your new posts on X, WhatsApp, or any other platform.',
								'jetpack'
							) }
							<br />
							<br />
							{ __(
								"We'll auto-format your shareable content. Just click on the Social icons, or the 'Copy to Clipboard' icon, and you're set. This way, you can share on any social platform you like.",
								'jetpack'
							) }
							<br />
							<br />
							{ __( 'Simplifying social sharing, one click at a time!', 'jetpack' ) }
						</Text>
						<hr />
						<div className={ styles.sharing }>
							<Text variant="title-small">{ __( 'One-Click Sharing', 'jetpack' ) }</Text>
							<ShareButtons />
						</div>
						<hr />
					</div>
					{ ! isSm && (
						<div className={ styles[ 'second-column' ] }>
							<ResponsiveWrapper naturalWidth={ 350 }>
								<img className={ styles.illustration } src={ illustration } alt="" />
							</ResponsiveWrapper>
						</div>
					) }
				</div>
			</ThemeProvider>
		</Modal>
	);
};

export default OneClickSharingModal;
