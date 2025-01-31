import { Button, TextControl, Icon, KeyboardShortcuts } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { arrowRight } from '@wordpress/icons';

export const OptionsInput = ( {
	disabled,
	handleRetry,
	retryCtaLabel,
	handleSubmit,
	submitCtaLabel,
} ) => {
	return (
		<div className="assistant-wizard__actions">
			<Button variant="secondary" className="assistant-wizard__submit" onClick={ handleRetry }>
				{ retryCtaLabel }
			</Button>

			<Button
				variant="primary"
				className="assistant-wizard__submit"
				onClick={ handleSubmit }
				disabled={ disabled }
			>
				{ submitCtaLabel }&nbsp;
				<Icon icon={ arrowRight } size={ 24 } />
			</Button>
		</div>
	);
};

function UnforwardedKeywordsInput( { placeholder, value, setValue, handleSubmit }, ref ) {
	return (
		<div ref={ ref } className="assistant-wizard__input">
			<KeyboardShortcuts shortcuts={ { enter: handleSubmit } }>
				<TextControl value={ value } onChange={ setValue } placeholder={ placeholder } />
			</KeyboardShortcuts>
			<Button
				variant="primary"
				className="assistant-wizard__submit"
				onClick={ handleSubmit }
				size="small"
				disabled={ ! value }
			>
				↑
			</Button>
		</div>
	);
}

export const TextInput = forwardRef( UnforwardedKeywordsInput );

export const CompletionInput = ( { submitCtaLabel, handleSubmit } ) => {
	return (
		<div className="assistant-wizard__completion">
			<Button variant="primary" className="assistant-wizard__submit" onClick={ handleSubmit }>
				{ submitCtaLabel }
			</Button>
		</div>
	);
};
