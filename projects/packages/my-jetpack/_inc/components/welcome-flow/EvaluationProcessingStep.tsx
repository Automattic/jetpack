import { Col, Text } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React from 'react';
import styles from './style.module.scss';

const EvaluationProcessingStep = () => {
	return (
		<Col className={ styles[ 'banner-evaluation' ] }>
			<div className={ styles[ 'banner-loader' ] }>
				<Spinner />
			</div>
			<Text variant="title-medium" mb={ 1 }>
				{ __( 'Initiating site evaluation', 'jetpack-my-jetpack' ) }
			</Text>
			<Text variant="body-small">
				{ __(
					'Starting the process to provide personalized plugin suggestions…',
					'jetpack-my-jetpack'
				) }
			</Text>
		</Col>
	);
};

export default EvaluationProcessingStep;
