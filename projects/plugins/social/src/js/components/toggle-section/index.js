/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Container, Text } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import ModuleToggle from './../module-toggle';
import styles from './styles.module.scss';

const ToggleSection = () => (
	<>
		<Container horizontalSpacing={ 7 } horizontalGap={ 3 }>
			<div className={ styles.column }>
				<ModuleToggle className={ styles.toggle } />
				<Text className={ styles.title } variant="title-medium">
					{ __( 'Automatically share your posts to social networks', 'jetpack-social' ) }
				</Text>
				<Text className={ styles.text }>
					{ __(
						'When enabled, you’ll be able to connect your social media accounts and send a post’s featured image and content to the selected channels with a single click when the post is published. Learn more',
						'jetpack-social'
					) }
				</Text>
			</div>
		</Container>
	</>
);

export default ToggleSection;
