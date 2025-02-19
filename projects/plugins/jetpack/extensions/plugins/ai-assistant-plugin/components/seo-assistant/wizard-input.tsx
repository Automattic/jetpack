import { Button, TextControl, Icon, KeyboardShortcuts } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { arrowRight } from '@wordpress/icons';

export const OptionsInput = ( {
	disabled,
	loading,
	handleRetry,
	retryCtaLabel,
	handleSubmit,
	submitCtaLabel,
} ) => {
	return (
		<div className="jetpack-wizard-chat__actions">
			<Button
				variant="secondary"
				className="jetpack-wizard-chat__submit"
				onClick={ handleRetry }
				disabled={ loading }
			>
				{ retryCtaLabel }
			</Button>

			<Button
				variant="primary"
				className="jetpack-wizard-chat__submit"
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
		<div ref={ ref } className="jetpack-wizard-chat__input">
			<KeyboardShortcuts shortcuts={ { enter: handleSubmit } }>
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					value={ value }
					onChange={ setValue }
					placeholder={ placeholder }
				/>
			</KeyboardShortcuts>
			<Button
				variant="primary"
				className="jetpack-wizard-chat__submit"
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
		<div className="jetpack-wizard-chat__completion">
			<Button variant="primary" className="jetpack-wizard-chat__submit" onClick={ handleSubmit }>
				{ submitCtaLabel }
			</Button>
		</div>
	);
};
