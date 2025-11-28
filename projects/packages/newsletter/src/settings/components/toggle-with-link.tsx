/**
 * External dependencies
 */
import { ExternalLink, ToggleControl } from '@wordpress/components';
import { type Field } from '@wordpress/dataviews';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './toggle-with-link.scss';

interface ToggleWithLinkProps {
	data: Record< string, unknown >;
	field: Field< Record< string, unknown > >;
	onChange: ( updates: Record< string, unknown > ) => void;
	url: string;
	linkText: string;
}

/**
 * Generic toggle control with an external link in the label
 *
 * @param {object}   props          - Component props
 * @param {object}   props.data     - The data object
 * @param {object}   props.field    - The field definition
 * @param {Function} props.onChange - Change handler
 * @param {string}   props.url      - URL for the external link
 * @param {string}   props.linkText - Text for the link
 * @return {JSX.Element} The toggle control with link
 */
function ToggleWithLink( {
	data,
	field,
	onChange,
	url,
	linkText,
}: ToggleWithLinkProps ): JSX.Element {
	const handleChange = useCallback( () => {
		onChange( { [ field.id ]: ! data[ field.id ] } );
	}, [ data, field.id, onChange ] );

	return (
		<ToggleControl
			checked={ !! data[ field.id ] }
			onChange={ handleChange }
			label={
				<span className="toggle-with-link__label">
					{ field.label }
					<ExternalLink href={ url }>{ linkText }</ExternalLink>
				</span>
			}
		/>
	);
}

interface ToggleWithEditorLinkProps {
	data: Record< string, unknown >;
	field: Field< Record< string, unknown > >;
	onChange: ( updates: Record< string, unknown > ) => void;
	siteAdminUrl: string;
	themeStylesheet: string;
	postType: 'wp_template' | 'wp_template_part';
	templateId: string;
}

/**
 * Toggle control with a "Preview and edit" link to the site editor
 *
 * @param {object}   props                 - Component props
 * @param {object}   props.data            - The data object
 * @param {object}   props.field           - The field definition
 * @param {Function} props.onChange        - Change handler
 * @param {string}   props.siteAdminUrl    - Site admin URL
 * @param {string}   props.themeStylesheet - Theme stylesheet name
 * @param {string}   props.postType        - Post type (wp_template or wp_template_part)
 * @param {string}   props.templateId      - Template ID
 * @return {JSX.Element} The toggle control with editor link
 */
export function ToggleWithEditorLink( {
	data,
	field,
	onChange,
	siteAdminUrl,
	themeStylesheet,
	postType,
	templateId,
}: ToggleWithEditorLinkProps ): JSX.Element {
	const url = addQueryArgs( `${ siteAdminUrl }site-editor.php`, {
		postType,
		postId: `${ themeStylesheet }//${ templateId }`,
		canvas: 'edit',
	} );

	return (
		<ToggleWithLink
			data={ data }
			field={ field }
			onChange={ onChange }
			url={ url }
			linkText={ __( 'Preview and edit', 'jetpack-newsletter' ) }
		/>
	);
}
