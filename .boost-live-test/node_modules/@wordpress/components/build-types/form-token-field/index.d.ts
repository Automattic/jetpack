import type { FormTokenFieldProps } from './types';
/**
 * A `FormTokenField` is a field similar to the tags and categories fields in the interim editor chrome,
 * or the "to" field in Mail on OS X. Tokens can be entered by typing them or selecting them from a list of suggested tokens.
 *
 * Up to one hundred suggestions that match what the user has typed so far will be shown from which the user can pick from (auto-complete).
 * Tokens are separated by the "," character. Suggestions can be selected with the up or down arrows and added with the tab or enter key.
 *
 * The `value` property is handled in a manner similar to controlled form components.
 * See [Forms](https://react.dev/reference/react-dom/components#form-components) in the React Documentation for more information.
 */
export declare function FormTokenField(props: FormTokenFieldProps): import("react").JSX.Element;
export default FormTokenField;
//# sourceMappingURL=index.d.ts.map