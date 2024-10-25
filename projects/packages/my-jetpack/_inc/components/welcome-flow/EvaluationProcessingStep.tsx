import { Col, Text } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import styles from './style.module.scss';

const EvaluationProcessingStep = () => {
	return (
		<Col className={ styles[ 'banner-evaluation' ] }>
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
};

export default EvaluationProcessingStep;
