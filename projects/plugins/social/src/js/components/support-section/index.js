import {
	Text,
	Container,
	getRedirectUrl,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { SOCIAL_STORE_ID } from '@automattic/jetpack-publicize-components';
import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, lifesaver } from '@wordpress/icons';
import clsx from 'clsx';
import IconText from '../icon-text';
import styles from './styles.module.scss';

const SupportSection = () => {
	const [ isAtLeastMedium ] = useBreakpointMatch( 'md', '>=' );
	const hasPaidPlan = useSelect( select => select( SOCIAL_STORE_ID ).hasPaidPlan() );

	if ( ! hasPaidPlan ) {
		return null;
	}

	return (
		<Container
			horizontalSpacing={ 7 }
			horizontalGap={ 3 }
			className={ clsx( {
				[ styles[ 'is-viewport-medium' ] ]: isAtLeastMedium,
			} ) }
		>
			<IconText
				icon={ <Icon icon={ lifesaver } size={ 30 } className={ styles.icon }></Icon> }
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
