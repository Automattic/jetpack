import { Button, TextControl, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { arrowRight } from '@wordpress/icons';

export default function WizardInput( { currentStepData, handleSubmit, handleDone } ) {
	const selectedOption =
		currentStepData.type === 'options' ? currentStepData.options.find( opt => opt.selected ) : null;
	return (
		<div className="seo-assistant-wizard__input-container">
			{ currentStepData.type === 'input' && (
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
						disabled={ ! currentStepData.value }
					>
						↑
					</Button>
				</div>
			) }

			{ currentStepData.type === 'options' && (
				<div className="seo-assistant-wizard__actions">
					<Button variant="secondary" onClick={ currentStepData.onRetry }>
						{ currentStepData.onRetryCtaLabel }
					</Button>

					<Button variant="primary" onClick={ handleSubmit } disabled={ ! selectedOption }>
						{ currentStepData.submitCtaLabel }&nbsp;
						<Icon icon={ arrowRight } size={ 24 } />
					</Button>
				</div>
			) }

			{ currentStepData.type === 'completion' && (
				<div className="seo-assistant-wizard__completion">
					<Button variant="primary" className="seo-assistant-wizard__done" onClick={ handleDone }>
						{ __( 'Done', 'jetpack' ) }
					</Button>
				</div>
			) }
		</div>
	);
}
