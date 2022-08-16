import { Text, Container, getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, lifesaver } from '@wordpress/icons';
import { STORE_ID } from '../../store';
import IconText from '../icon-text';
import styles from './styles.module.scss';

const SupportSection = () => {
	const hasPaidPlan = useSelect( select => select( STORE_ID ).hasPaidPlan() );

	if ( ! hasPaidPlan ) {
		return null;
	}

	return (
		<Container horizontalSpacing={ 7 } horizontalGap={ 3 }>
			<IconText
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
					<ExternalLink href={ getRedirectUrl( 'https://wordpress.com/support' ) }>
						{ __( 'Contact Support', 'jetpack-social' ) }
					</ExternalLink>
				</Text>
			</IconText>
		</Container>
	);
};

export default SupportSection;
