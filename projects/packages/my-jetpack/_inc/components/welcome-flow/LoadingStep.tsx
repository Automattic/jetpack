import { Col, Text } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import styles from './style.module.scss';

interface LoadingStepProps {
	type: string;
}

const LoadingStep = ( { type }: LoadingStepProps ) => {
	if ( type === 'connecting' || type === 'connection-ready' ) {
		const connectingTitle = __( 'Connecting Jetpack', 'jetpack-my-jetpack' );
		const connectingDescription = __(
			'Getting things ready in the background — almost there!.',
			'jetpack-my-jetpack'
		);
		/* translators: %s: is an emoji 🎉 */
		const connectionReadyTitle = __( 'Jetpack is connected %s', 'jetpack-my-jetpack' );
		const connectionReadyDescription = __(
			'Youre connected and ready to fly!',
			'jetpack-my-jetpack'
		);

		return (
			<Col className={ styles[ 'loading-banner' ] }>
				<div className={ styles[ 'banner-loader' ] }>
					<Spinner />
				</div>
				<Text variant="title-medium" mb={ 1 }>
					{ type === 'connecting' ? connectingTitle : sprintf( connectionReadyTitle, '🎉' ) }
				</Text>
				<Text variant="body-small">
					{ type === 'connecting' ? connectingDescription : connectionReadyDescription }
				</Text>
			</Col>
		);
	}

	if ( type === 'recommendations' ) {
		return (
			<Col className={ styles[ 'loading-banner' ] }>
				<div className={ styles[ 'banner-loader' ] }>
					<Spinner />
				</div>
				<Text variant="title-medium" mb={ 1 }>
					{ __( 'Finding the best Jetpack tools', 'jetpack-my-jetpack' ) }
				</Text>
				<Text variant="body-small">
					{ __(
						'We‘re crunching the numbers to find the Jetpack tools that are the best match for your site.',
						'jetpack-my-jetpack'
					) }
				</Text>
			</Col>
		);
	}

	return <></>;
};

export default LoadingStep;
