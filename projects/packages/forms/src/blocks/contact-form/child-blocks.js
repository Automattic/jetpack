import { hasFeatureFlag } from '@automattic/jetpack-shared-extension-utils';
import DeprecatedOptionCheckbox from '../deprecated/field-option-checkbox/index.js';
import DeprecatedOptionRadio from '../deprecated/field-option-radio/index.js';
import JetpackDropzone from '../dropzone/index.js';
import JetpackCheckboxField from '../field-checkbox/index.js';
import JetpackConsentField from '../field-consent/index.js';
import JetpackDateField from '../field-date/index.js';
import JetpackEmailField from '../field-email/index.js';
import JetpackFieldFile from '../field-file/index.js';
import JetpackHiddenField from '../field-hidden/index.js';
import JetpackImageSelectField from '../field-image-select/index.tsx';
import JetpackMultipleChoiceField from '../field-multiple-choice/index.js';
import JetpackNameField from '../field-name/index.js';
import JetpackNumberField from '../field-number/index.js';
import JetpackRatingField from '../field-rating/index.js';
import JetpackDropdownField from '../field-select/index.js';
import JetpackSingleChoiceField from '../field-single-choice/index.js';
import JetpackFieldSlider from '../field-slider/index.js';
import JetpackTelephoneField from '../field-telephone/index.js';
import JetpackTextField from '../field-text/index.js';
import JetpackTextareaField from '../field-textarea/index.js';
import JetpackTimeField from '../field-time/index.js';
import JetpackUrlField from '../field-url/index.js';
import JetpackImageOptionsFieldset from '../fieldset-image-options/index.tsx';
import JetpackProgressIndicator from '../form-progress-indicator/index.js';
import JetpackStep from '../form-step/index.js';
import JetpackStepContainer from '../form-step-container/index.js';
import JetpackStepDivider from '../form-step-divider/index.js';
import JetpackStepNavigation from '../form-step-navigation/index.js';
import JetpackInput from '../input/index.js';
import JetpackImageOptionInput from '../input-image-option/index.tsx';
import JetpackPhoneInput from '../input-phone/index.js';
import JetpackSliderInput from '../input-range/index.js';
import JetpackRatingInput from '../input-rating/index.js';
import JetpackLabel from '../label/index.js';
import JetpackOption from '../option/index.js';
import JetpackOptions from '../options/index.js';

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
	JetpackHiddenField,
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
	JetpackTimeField,
	JetpackFieldFile,
	JetpackRatingField,
	JetpackRatingInput,
	JetpackFieldSlider,
	JetpackSliderInput,
	JetpackImageSelectField,
	JetpackImageOptionsFieldset,
	JetpackImageOptionInput,

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
];
