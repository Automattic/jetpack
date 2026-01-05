import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import CreateFormButton from '../create-form-button/index.tsx';
import { EmptyWrapper } from '../empty-responses/index.tsx';

const EmptyForms = () => {
	return (
		<EmptyWrapper
			heading={ __( "You're set up. No forms yet.", 'jetpack-forms' ) }
			body={ __(
				'Create a reusable form to manage and reuse it across your site.',
				'jetpack-forms'
			) }
			actions={
				<CreateFormButton label={ __( 'Create a new form', 'jetpack-forms' ) } variant="primary" />
			}
		/>
	);
};

export default EmptyForms;
