Form Components
===============

This is a directory of shared form components.

### Formsy

See [Formsy repo on github](https://github.com/christianalfoni/formsy-react/) for the complete API documentation.

### Form Fields

The following components exist to minimize duplication among DOPS products.

- Form
- Form.ActionBar
- Form.Section
- Form.Row
- Form.Label
- Form.TextInput
- Form.RadioInput
- Form.CheckboxInput
- Form.MultiCheckboxInput
- Form.SelectInput
- Form.CountrySelect (uses Form.SelectInput)
- Form.HiddenInput
- Form.Submit

### Input Validation

In addition to the [formsy-supplied validations](https://github.com/christianalfoni/formsy-react/blob/master/API.md#validators), we've also added our own.

`isCC` uses [the lunh algorithm](https://gist.github.com/ShirtlessKirk/2134376) to check if a value is a valid credit card number.

`isArray` uses lodash's `isArray` to check if a value is an array.

### Input Formatters

The TextInput component can also format the input for credit card data. Currently supported formats are `cardNumber`, `cardExpiry`, and `cardCVC`/`cardCVV` (the last two are functionally the same). These don't prevent invalid form submissions, so validations are still necessary.

### Form Submission

Formsy adds new events for more granular control of form submissions.

See [`onSubmit`](https://github.com/christianalfoni/formsy-react/blob/master/API.md#onsubmitdata-resetform-invalidateform), [`onValidSubmit`](https://github.com/christianalfoni/formsy-react/blob/master/API.md#onvalidsubmitmodel-resetform-invalidateform), and [`onInvalidSubmit`](https://github.com/christianalfoni/formsy-react/blob/master/API.md#oninvalidsubmitmodel-resetform-invalidateform).

### Styles

There are shared form styles in `style.scss`, but it's meant to only give structure to the form. This should not be an opinionated file.
