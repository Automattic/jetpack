import { Container, Text } from '@automattic/jetpack-components';
import { useViewportMatch } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import styles from './styles.module.scss';

const InfoSection = () => {
	const isLg = useViewportMatch( 'large' );
	const isAtLeastMedium = useViewportMatch( 'small' );

	const viewportClasses = {
		[ styles[ 'is-viewport-large' ] ]: isLg,
		[ styles[ 'is-viewport-medium' ] ]: isAtLeastMedium,
	};

	return (
		<Container className={ clsx( viewportClasses ) } horizontalSpacing={ 7 } horizontalGap={ 3 }>
			<div className={ styles.column }>
				<Text variant="title-medium" className={ styles.title }>
					{ __( 'Did you know?', 'jetpack-publicize-pkg' ) }
				</Text>
				<Text variant="headline-small-regular" component={ 'span' } className={ styles.number }>
					40x
				</Text>
				<Text>
					{ __(
						'Visual content is 40 times more likely to get shared on social media than any other type. Remember to include an image.',
						'jetpack-publicize-pkg'
					) }
				</Text>
				<Text variant="headline-small-regular" component={ 'span' } className={ styles.number }>
					10x
				</Text>
				<Text>
					{ __(
						'By publishing at least once per week, you’ll be ahead of 99% of all other sites. Promoting that weekly content on social media may grow your audience by 10x in a few short months.',
						'jetpack-publicize-pkg'
					) }
				</Text>
			</div>
		</Container>
	);
};

export default InfoSection;
