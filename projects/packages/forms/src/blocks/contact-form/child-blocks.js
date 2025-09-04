import {
	hasFeatureFlag,
	getJetpackBlocksVariation,
} from '@automattic/jetpack-shared-extension-utils';
import DeprecatedOptionCheckbox from '../deprecated/field-option-checkbox';
import DeprecatedOptionRadio from '../deprecated/field-option-radio';
import JetpackDropzone from '../dropzone';
import JetpackCheckboxField from '../field-checkbox';
import JetpackConsentField from '../field-consent/';
import JetpackDateField from '../field-date';
import JetpackEmailField from '../field-email';
import JetpackFieldFile from '../field-file';
import JetpackImageSelectField from '../field-image-select';
import JetpackMultipleChoiceField from '../field-multiple-choice';
import JetpackNameField from '../field-name';
import JetpackNumberField from '../field-number';
import JetpackRatingField from '../field-rating';
import JetpackDropdownField from '../field-select';
import JetpackSingleChoiceField from '../field-single-choice';
import JetpackFieldSlider from '../field-slider';
import JetpackTelephoneField from '../field-telephone';
import JetpackTextField from '../field-text';
import JetpackTextareaField from '../field-textarea';
import JetpackTimeField from '../field-time';
import JetpackUrlField from '../field-url';
import JetpackImageOptionsFieldset from '../fieldset-image-options';
import JetpackProgressIndicator from '../form-progress-indicator';
import JetpackStep from '../form-step';
import JetpackStepContainer from '../form-step-container';
import JetpackStepDivider from '../form-step-divider';
import JetpackStepNavigation from '../form-step-navigation';
import JetpackInput from '../input';
import JetpackImageOptionInput from '../input-image-option';
import JetpackPhoneInput from '../input-phone';
import JetpackSliderInput from '../input-range';
import JetpackRatingInput from '../input-rating';
import JetpackLabel from '../label';
import JetpackOption from '../option';
import JetpackOptions from '../options';

export const childBlocks = [
	JetpackLabel,
	JetpackDropzone,
	JetpackInput,
	JetpackOption,
	JetpackOptions,
	JetpackCheckboxField,
	JetpackConsentField,
	JetpackDateField,
	JetpackDropdownField,
	JetpackEmailField,
	JetpackMultipleChoiceField,
	JetpackNameField,
	JetpackNumberField,
	JetpackPhoneInput,
	JetpackSingleChoiceField,
	JetpackTextField,
	JetpackUrlField,
	JetpackTelephoneField,
	JetpackTextareaField,
	JetpackFieldFile,
	...( getJetpackBlocksVariation() === 'experimental'
		? [ JetpackRatingField, JetpackRatingInput, JetpackFieldSlider, JetpackSliderInput ]
		: [] ),
	...( getJetpackBlocksVariation() === 'beta' ? [ JetpackTimeField ] : [] ),

	// The following are required for these blocks to be parsed correctly in block
	// deprecations. They have been flagged with `supports.inserter: false` to
	// prevent further use.
	DeprecatedOptionCheckbox,
	DeprecatedOptionRadio,
	...( hasFeatureFlag( 'multistep-form' )
		? [
				JetpackStep,
				JetpackStepContainer,
				JetpackStepDivider,
				JetpackStepNavigation,
				JetpackProgressIndicator,
		  ]
		: [] ),
	...( hasFeatureFlag( 'image-select-field' )
		? [ JetpackImageSelectField, JetpackImageOptionsFieldset, JetpackImageOptionInput ]
		: [] ),
];
