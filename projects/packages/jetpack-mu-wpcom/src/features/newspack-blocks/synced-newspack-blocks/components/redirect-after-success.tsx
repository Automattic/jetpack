/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl, SelectControl } from '@wordpress/components';

type Props = {
	attributes: {
		afterSuccessBehavior: string;
		afterSuccessButtonLabel: string;
		afterSuccessURL: string;
	};
	setAttributes: ( attributes: Partial< Props[ 'attributes' ] > ) => void;
};

const RedirectAfterSuccess = ( { attributes, setAttributes }: Props ) => (
	<>
		<SelectControl
			label={ __( 'Post-Checkout Button', 'jetpack-mu-wpcom' ) }
			help={ __(
				'After a successful purchase, a button will be presented to finish the process.',
				'jetpack-mu-wpcom'
			) }
			value={ attributes.afterSuccessBehavior }
			options={ [
				{ label: __( 'Close the modal', 'jetpack-mu-wpcom' ), value: '' },
				{ label: __( 'Go to a custom URL', 'jetpack-mu-wpcom' ), value: 'custom' },
				{ label: __( 'Go to the previous page', 'jetpack-mu-wpcom' ), value: 'referrer' },
			] }
			onChange={ ( value: string ) => {
				setAttributes( { afterSuccessBehavior: value.toString() } );
			} }
		/>
		<TextControl
			label={ __( 'Button Label', 'jetpack-mu-wpcom' ) }
			value={ attributes.afterSuccessButtonLabel || '' }
			onChange={ ( value: string ) => setAttributes( { afterSuccessButtonLabel: value } ) }
		/>
		{ attributes.afterSuccessBehavior === 'custom' && (
			<TextControl
				label={ __( 'Custom URL', 'jetpack-mu-wpcom' ) }
				placeholder={ __( 'https://example.com', 'jetpack-mu-wpcom' ) }
				value={ attributes.afterSuccessURL || '' }
				onChange={ ( value: string ) => setAttributes( { afterSuccessURL: value } ) }
			/>
		) }
	</>
);

export default RedirectAfterSuccess;
