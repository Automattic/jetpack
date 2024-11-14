import { Col, Button, Text } from '@automattic/jetpack-components';
import { CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import styles from './style.module.scss';

export type EvaluationAreas = 'protect' | 'performance' | 'audience' | 'content' | 'unsure';

const questions: { [ key in EvaluationAreas ]: string } = {
	protect: __( 'Protect my site', 'jetpack-my-jetpack' ),
	performance: __( 'Improve my site‘s performance', 'jetpack-my-jetpack' ),
	audience: __( 'Grow my audience', 'jetpack-my-jetpack' ),
	content: __( 'Create quality content', 'jetpack-my-jetpack' ),
	unsure: __( 'I don‘t know', 'jetpack-my-jetpack' ),
};

const defaultValues: { [ key in EvaluationAreas ]: boolean } = {
	protect: false,
	performance: false,
	audience: false,
	content: false,
	unsure: false,
};

type EvaluationStepProps = {
	onSkipOnboarding: () => void;
	onSubmitEvaluation: ( values: { [ key in EvaluationAreas ]: boolean } ) => void;
};

const EvaluationStep = ( {
	onSkipOnboarding,
	onSubmitEvaluation: onSubmitAnswers,
}: EvaluationStepProps ) => {
	const [ values, setValues ] = useState( defaultValues );
	const setChecked = useCallback(
		( key: EvaluationAreas ) => ( value: boolean ) => {
			setValues( prevValues => ( { ...prevValues, [ key ]: value } ) );
		},
		[ setValues ]
	);

	const handleSubmit = useCallback( () => onSubmitAnswers( values ), [ onSubmitAnswers, values ] );

	const isSelected = Object.values( values ).some( v => v );

	return (
		<>
			<Col sm={ 6 } md={ 8 } lg={ 6 } className={ styles[ 'banner-description' ] }>
				<Text variant="headline-small" mb={ 3 }>
					{ __( 'What would you like Jetpack to do?', 'jetpack-my-jetpack' ) }
				</Text>
				<Text variant="body" mb={ 2 }>
					{ __(
						'Jetpack does a lot. Select the items that are most important to you and we‘ll find the Jetpack tools that are the best match for your site.',
						'jetpack-my-jetpack'
					) }
				</Text>
				<form className={ styles.form }>
					{ Object.entries( questions ).map( ( [ key, question ]: [ EvaluationAreas, string ] ) => (
						<CheckboxControl
							key={ key }
							className={ styles[ 'form-checkbox' ] }
							label={ question }
							checked={ values[ key ] }
							onChange={ setChecked( key ) }
							__nextHasNoMarginBottom={ true }
						/>
					) ) }
					<div className={ styles[ 'form-actions' ] }>
						<Button
							variant="primary"
							text={ __( 'See solutions', 'jetpack-my-jetpack' ) }
							onClick={ handleSubmit }
							disabled={ ! isSelected }
						/>
						<Button
							variant="link"
							className={ styles[ 'form-link-action' ] }
							text={ __( 'Skip onboarding', 'jetpack-my-jetpack' ) }
							onClick={ onSkipOnboarding }
						/>
					</div>
				</form>
			</Col>
			<Col
				sm={ 6 }
				md={ 8 }
				lg={ 6 }
				className={ clsx( styles[ 'banner-image-evaluation' ], {
					[ styles[ 'is-selected' ] ]: isSelected,
				} ) }
			></Col>
		</>
	);
};

export default EvaluationStep;
