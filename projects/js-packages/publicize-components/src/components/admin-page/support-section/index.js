import {
	Text,
	Container,
	getRedirectUrl,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, lifesaver } from '@wordpress/icons';
import clsx from 'clsx';
import { hasSocialPaidFeatures } from '../../../utils';
import IconText from './icon-text';
import styles from './styles.module.scss';

const SupportSection = () => {
	const [ isAtLeastMedium ] = useBreakpointMatch( 'md', '>=' );

	if ( ! hasSocialPaidFeatures() ) {
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
				title={ __( 'World-class support', 'jetpack-publicize-components' ) }
			>
				<Text>
					{ __(
						'Do you need any help? Get in touch with our world-class support with a high-priority support ticket and get a solution faster.',
						'jetpack-publicize-components'
					) }
				</Text>
				<Text className={ styles.link }>
					<ExternalLink href={ getRedirectUrl( 'jetpack-contact-support' ) }>
						{ __( 'Contact Support', 'jetpack-publicize-components' ) }
					</ExternalLink>
				</Text>
			</IconText>
		</Container>
	);
};

export default SupportSection;
