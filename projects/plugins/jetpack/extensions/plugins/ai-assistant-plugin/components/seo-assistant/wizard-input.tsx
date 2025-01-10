import { Button, TextControl, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { arrowRight } from '@wordpress/icons';

export default function WizardInput( { currentStepData, handleSubmit, handleDone } ) {
	if ( currentStepData.type === 'input' ) {
		return (
			<div className="seo-assistant-wizard__input">
				<TextControl
					value={ currentStepData.value }
					onChange={ currentStepData.setValue }
					placeholder={ currentStepData.placeholder }
				/>
				<Button
					variant="primary"
					className="seo-assistant-wizard__submit"
					onClick={ handleSubmit }
					size="small"
				>
					↑
				</Button>
			</div>
		);
	}

	if ( currentStepData.type === 'options' ) {
		const selectedOption = currentStepData.options.find( opt => opt.selected );
		return (
			<div className="seo-assistant-wizard__actions">
				<Button variant="secondary" onClick={ currentStepData.onRetry }>
					{ currentStepData.onRetryCtaLabel }
				</Button>

				<Button variant="primary" onClick={ handleSubmit } disabled={ ! selectedOption }>
					{ currentStepData.submitCtaLabel }&nbsp;
					<Icon icon={ arrowRight } size="24" />
				</Button>
			</div>
		);
	}

	if ( currentStepData.type === 'completion' ) {
		return (
			<div className="seo-assistant-wizard__completion">
				<Button variant="primary" className="seo-assistant-wizard__done" onClick={ handleDone }>
					{ __( 'Done', 'jetpack' ) }
				</Button>
			</div>
		);
	}

	return null;
}
