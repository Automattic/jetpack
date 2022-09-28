import { Button, Container, Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_ID } from '../../store';
import ModuleToggle from './../module-toggle';
import styles from './styles.module.scss';

const ToggleSection = () => {
	const { connectionsAdminUrl, isModuleEnabled, isUpdating } = useSelect( select => {
		const store = select( STORE_ID );
		return {
			isModuleEnabled: store.isModuleEnabled(),
			isUpdating: store.isUpdatingJetpackSettings(),
			connectionsAdminUrl: store.getConnectionsAdminUrl(),
		};
	} );

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	return (
		<Container horizontalSpacing={ 7 } horizontalGap={ 3 }>
			<div className={ styles.column }>
				<ModuleToggle className={ styles.toggle } />
				<Text className={ styles.title } variant="title-medium">
					{ __( 'Automatically share your posts to social networks', 'jetpack-social' ) }
				</Text>
				<Text className={ styles.text }>
					{ __(
						'When enabled, you’ll be able to connect your social media accounts and send a post’s featured image and content to the selected channels with a single click when the post is published.',
						'jetpack-social'
					) }
					&nbsp;
					<ExternalLink href="https://jetpack.com/redirect/?source=social-plugin-publicize-support-admin-page">
						{ __( 'Learn more', 'jetpack-social' ) }
					</ExternalLink>
				</Text>
				{ connectionsAdminUrl && (
					<Button
						fullWidth={ isSmall }
						className={ styles.button }
						variant="secondary"
						isExternalLink={ true }
						href={ connectionsAdminUrl }
						disabled={ isUpdating || ! isModuleEnabled }
						target="_blank"
					>
						{ __( 'Manage social media connections', 'jetpack-social' ) }
					</Button>
				) }
			</div>
		</Container>
	);
};

export default ToggleSection;
