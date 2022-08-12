import { Text } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, lifesaver } from '@wordpress/icons';
import IconTextSection from '../icon-text-section';
import styles from './styles.module.scss';

const SupportSection = () => (
	<IconTextSection
		icon={ <Icon icon={ lifesaver } size={ 30 }></Icon> }
		title={ __( 'World-class support', 'jetpack-social' ) }
	>
		<Text>
			{ __(
				'Do you need any help? Get in touch with our world-class support with a high-priority support ticket and get a solution faster.',
				'jetpack-social'
			) }
		</Text>
		<Text className={ styles.link }>
			<ExternalLink href="https://wordpress.com/support">
				{ __( 'Contact Support', 'jetpack-social' ) }
			</ExternalLink>
		</Text>
	</IconTextSection>
);

export default SupportSection;
