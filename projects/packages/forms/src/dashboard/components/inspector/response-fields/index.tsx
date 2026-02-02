/**
 * Internal dependencies
 */
import clsx from 'clsx';
import {
	isFieldsCollection,
	isFileUploadField,
	isImageSelectField,
	isLikelyPhoneNumber,
} from '../utils';
import FieldEmail from './field-email/index.tsx';
import FieldFile from './field-file/index.tsx';
import FieldImageSelect from './field-image-select/index.tsx';
import FieldPreview from './field-preview/index.tsx';
import type { FileItem, ResponseField, ResponseFields } from '../../../../types/index.ts';

export type ResponseFieldsProps = {
	fields: ResponseFields;
	onFilePreview: ( file: FileItem | { url: string; name: string } ) => () => void;
	className: string;
};

/**
 * Renders the response fields (legacy key-value or new collection format).
 *
 * @param props               - Component props.
 * @param props.fields        - The response fields (array or record).
 * @param props.onFilePreview - Callback that returns a handler to open file preview for a given file.
 * @param props.className     - CSS class for the container.
 * @return The response fields view.
 */
const ResponseFieldsIterator = ( {
	fields,
	onFilePreview,
	className,
}: ResponseFieldsProps ): import('react').JSX.Element => {
	const fieldsAreNewFormat = isFieldsCollection( fields );
	const rootClass = clsx( className, {
		'is-collection-format': fieldsAreNewFormat,
	} );
	const renderFieldValue = ( value: unknown ) => {
		if ( isImageSelectField( value ) ) {
			return (
				<FieldImageSelect
					choices={ ( value as { choices: unknown } ).choices }
					handleFilePreview={ onFilePreview }
				/>
			);
		}

		if ( isFileUploadField( value ) ) {
			const fileValue = value as { files?: FileItem[] };
			return <FieldFile files={ fileValue.files } handleFilePreview={ onFilePreview } />;
		}

		const emailRegEx = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
		if ( typeof value === 'string' && emailRegEx.test( value ) ) {
			return <FieldEmail email={ value } />;
		}

		if ( isLikelyPhoneNumber( value ) ) {
			return <a href={ `tel:${ value }` }>{ String( value ) }</a>;
		}

		return value as import('react').ReactNode;
	};

	return (
		<div className={ rootClass }>
			{ fields &&
				! fieldsAreNewFormat &&
				Object.entries( fields ).map( ( [ key, value ] ) => (
					<div key={ key } className="jp-forms__inbox-response-item">
						<div className="jp-forms__inbox-response-data-label">
							{ key.endsWith( '?' ) ? key : `${ key }:` }
						</div>
						<div className="jp-forms__inbox-response-data-value">{ renderFieldValue( value ) }</div>
					</div>
				) ) }
			{ fields &&
				fieldsAreNewFormat &&
				( Array.isArray( fields ) ? fields : ( Object.values( fields ) as ResponseField[] ) ).map(
					field => (
						<FieldPreview key={ field.key } field={ field } onFilePreview={ onFilePreview } />
					)
				) }
		</div>
	);
};

export default ResponseFieldsIterator;
