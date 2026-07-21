import { hasFeatureFlag } from '@automattic/jetpack-shared-extension-utils';
import DeprecatedOptionCheckbox from '../deprecated/field-option-checkbox/index.js';
import DeprecatedOptionRadio from '../deprecated/field-option-radio/index.js';
import JetpackDropzone from '../dropzone/index.jsx';
import JetpackCheckboxField from '../field-checkbox/index.js';
import JetpackConsentField from '../field-consent/index.js';
import JetpackDateField from '../field-date/index.js';
import JetpackEmailField from '../field-email/index.jsx';
import JetpackFieldFile from '../field-file/index.jsx';
import JetpackHiddenField from '../field-hidden/index.js';
import JetpackImageSelectField from '../field-image-select/index.tsx';
import JetpackMultipleChoiceField from '../field-multiple-choice/index.js';
import JetpackNameField from '../field-name/index.js';
import JetpackNumberField from '../field-number/index.js';
import JetpackRatingField from '../field-rating/index.js';
import JetpackDropdownField from '../field-select/index.js';
import JetpackSingleChoiceField from '../field-single-choice/index.js';
import JetpackFieldSlider from '../field-slider/index.jsx';
import JetpackTelephoneField from '../field-telephone/index.jsx';
import JetpackTextField from '../field-text/index.js';
import JetpackTextareaField from '../field-textarea/index.js';
import JetpackTimeField from '../field-time/index.js';
import JetpackUrlField from '../field-url/index.jsx';
import JetpackImageOptionsFieldset from '../fieldset-image-options/index.tsx';
import JetpackProgressIndicator from '../form-progress-indicator/index.jsx';
import JetpackStep from '../form-step/index.js';
import JetpackStepContainer from '../form-step-container/index.js';
import JetpackStepDivider from '../form-step-divider/index.jsx';
import JetpackStepNavigation from '../form-step-navigation/index.js';
import JetpackInput from '../input/index.jsx';
import JetpackImageOptionInput from '../input-image-option/index.tsx';
import JetpackPhoneInput from '../input-phone/index.jsx';
import JetpackSliderInput from '../input-range/index.jsx';
import JetpackRatingInput from '../input-rating/index.jsx';
import JetpackLabel from '../label/index.jsx';
import JetpackOption from '../option/index.jsx';
import JetpackOptions from '../options/index.jsx';

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
