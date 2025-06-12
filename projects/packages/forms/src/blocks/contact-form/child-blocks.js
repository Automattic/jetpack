import DeprecatedOptionCheckbox from '../deprecated/field-option-checkbox';
import DeprecatedOptionRadio from '../deprecated/field-option-radio';
import JetpackDropzone from '../dropzone';
import JetpackCheckboxField from '../field-checkbox';
import JetpackConsentField from '../field-consent/';
import JetpackDateField from '../field-date';
import JetpackEmailField from '../field-email';
import JetpackFieldFile from '../field-file';
import JetpackMultipleChoiceField from '../field-multiple-choice';
import JetpackNameField from '../field-name';
import JetpackNumberField from '../field-number';
import JetpackDropdownField from '../field-select';
import JetpackSingleChoiceField from '../field-single-choice';
import JetpackTelephoneField from '../field-telephone';
import JetpackTextField from '../field-text';
import JetpackTextareaField from '../field-textarea';
import JetpackUrlField from '../field-url';
import FormProgressIndicator from '../form-progress-indicator';
import JetpackInput from '../input';
import JetpackLabel from '../label';
import JetpackOption from '../option';
import JetpackOptions from '../options';
import Step from '../step';
import StepContainer from '../step-container';
import StepDivider from '../step-divider';
import StepNavigation from '../step-navigation';

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
	JetpackSingleChoiceField,
	JetpackTextField,
	JetpackUrlField,
	JetpackTelephoneField,
	JetpackTextareaField,
	JetpackFieldFile,
	Step,
	StepContainer,
	StepDivider,
	StepNavigation,
	FormProgressIndicator,
	// The following are required for these blocks to be parsed correctly in block
	// deprecations. They have been flagged with `supports.inserter: false` to
	// prevent further use.
	DeprecatedOptionCheckbox,
	DeprecatedOptionRadio,
];
