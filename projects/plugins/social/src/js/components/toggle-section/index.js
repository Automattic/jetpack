/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { Button, Container, Text } from '@automattic/jetpack-components';
import { Icon, external } from '@wordpress/icons';

/**
 * Internal dependencies
 */
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
					<a href="https://wordpress.com/support/publicize/" target="_blank" rel="noreferrer">
						{ __( 'Learn more', 'jetpack-social' ) }
					</a>
				</Text>
				{ connectionsAdminUrl && (
					<Button
						className={ styles.button }
						variant="primary"
						href={ connectionsAdminUrl }
						disabled={ isUpdating || ! isModuleEnabled }
						target="_blank"
					>
						{ __( 'Manage social media connections', 'jetpack-social' ) }
						<Icon size={ 24 } icon={ external } className={ styles[ 'external-icon' ] } />
					</Button>
				) }
			</div>
		</Container>
	);
};

export default ToggleSection;
