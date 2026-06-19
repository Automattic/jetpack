/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getAdminUrl, type SiteType } from '@automattic/jetpack-script-data';
import { ToggleControl } from '@wordpress/components';
import { type NormalizedField, type DeepPartial } from '@wordpress/dataviews';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
import type { NewsletterSettings } from '../types';

interface ToggleWithLinkProps {
	data: NewsletterSettings;
	field: NormalizedField< NewsletterSettings >;
	onChange: ( value: DeepPartial< NewsletterSettings > ) => void;
	url: string;
	linkText: string;
	isExternal?: boolean;
	onLinkClick?: () => void;
}

/**
 * Generic toggle control with a link in the label
 *
 * @param {object}   props             - Component props
 * @param {object}   props.data        - The data object
 * @param {object}   props.field       - The field definition
 * @param {Function} props.onChange    - Change handler
 * @param {string}   props.url         - URL for the link
 * @param {string}   props.linkText    - Text for the link
 * @param {boolean}  props.isExternal  - Whether the link is external (default: true)
 * @param {Function} props.onLinkClick - Optional callback when link is clicked
 * @return {JSX.Element} The toggle control with link
 */
export function ToggleWithLink( {
	data,
	field,
	onChange,
	url,
	linkText,
	isExternal = true,
	onLinkClick,
}: ToggleWithLinkProps ): JSX.Element {
	const handleChange = useCallback( () => {
		onChange( {
			[ field.id ]: ! ( data as Record< string, unknown > )[ field.id ],
		} as DeepPartial< NewsletterSettings > );
	}, [ data, field.id, onChange ] );

	return (
		<ToggleControl
			__nextHasNoMarginBottom
			checked={ !! ( data as Record< string, unknown > )[ field.id ] }
			onChange={ handleChange }
			label={
				<span>
					{ field.label }{ ' ' }
					{ isExternal ? (
						<Link openInNewTab href={ url } onClick={ onLinkClick }>
							{ linkText }
						</Link>
					) : (
						<a href={ url } onClick={ onLinkClick }>
							{ linkText }
						</a>
					) }
				</span>
			}
			help={ field.description }
		/>
	);
}

interface ToggleWithEditorLinkProps {
	data: NewsletterSettings;
	field: NormalizedField< NewsletterSettings >;
	onChange: ( value: DeepPartial< NewsletterSettings > ) => void;
	themeStylesheet: string;
	postType: 'wp_template' | 'wp_template_part';
	templateId: string;
	siteType?: SiteType;
}

/**
 * Toggle control with a "Preview and edit" link to the site editor
 *
 * @param {object}   props                 - Component props
 * @param {object}   props.data            - The data object
 * @param {object}   props.field           - The field definition
 * @param {Function} props.onChange        - Change handler
 * @param {string}   props.themeStylesheet - Theme stylesheet name
 * @param {string}   props.postType        - Post type (wp_template or wp_template_part)
 * @param {string}   props.templateId      - Template ID
 * @param {SiteType} props.siteType        - Site type for analytics tracking
 * @return {JSX.Element} The toggle control with editor link
 */
export function ToggleWithEditorLink( {
	data,
	field,
	onChange,
	themeStylesheet,
	postType,
	templateId,
	siteType,
}: ToggleWithEditorLinkProps ): JSX.Element {
	const url = addQueryArgs( getAdminUrl( 'site-editor.php' ), {
		postType,
		postId: `${ themeStylesheet }//${ templateId }`,
		canvas: 'edit',
	} );

	const handleLinkClick = useCallback( () => {
		if ( siteType ) {
			analytics.tracks.recordEvent( 'jetpack_newsletter_edit_link_click', {
				site_type: siteType,
				template: templateId,
			} );
		}
	}, [ siteType, templateId ] );

	return (
		<ToggleWithLink
			data={ data }
			field={ field }
			onChange={ onChange }
			url={ url }
			linkText={ __( 'Preview and edit', 'jetpack-newsletter' ) }
			isExternal={ false }
			onLinkClick={ handleLinkClick }
		/>
	);
}
