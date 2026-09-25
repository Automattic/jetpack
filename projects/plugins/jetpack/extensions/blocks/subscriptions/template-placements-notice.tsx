import colorStudio from '@automattic/color-studio';
import { getAdminUrl } from '@automattic/jetpack-script-data';
import { createHigherOrderComponent } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { getPlacementsForTemplate } from './settings-placements';

// Rendered before the footer in the editor only; BlockEdit output is never saved.
addFilter(
	'editor.BlockEdit',
	'jetpack/subscriptions/template-placements-notice',
	createHigherOrderComponent(
		BlockEdit => props => {
			const { area, slug, tagName } = props.attributes;
			const isFooter = area === 'footer' || slug === 'footer' || tagName === 'footer';
			if ( props.name !== 'core/template-part' || ! isFooter ) {
				return <BlockEdit { ...props } />;
			}

			return (
				<>
					<BlockEdit { ...props } />
					<TemplatePlacementsNotice />
				</>
			);
		},
		'withTemplatePlacementsNotice'
	)
);

/**
 * Lists the Newsletter placements enabled for the template being edited.
 *
 * Only site administrators can read the settings, so others get nothing.
 *
 * @return {JSX.Element|null} The notice element, or null if no placements are enabled for this template.
 */
function TemplatePlacementsNotice() {
	const { templateSlug, settings } = useSelect( select => {
		const { getCurrentPostType, getEditedPostAttribute } = select( editorStore );
		const isTemplate = getCurrentPostType() === 'wp_template';

		return {
			templateSlug: isTemplate ? getEditedPostAttribute( 'slug' ) : null,
			settings: isTemplate ? select( coreStore ).getEntityRecord( 'root', 'site' ) : null,
		};
	}, [] );

	if ( ! templateSlug || ! settings ) {
		return null;
	}

	// Get the placements enabled for this template, and filter to those that are actually enabled in settings.
	const enabled = getPlacementsForTemplate( templateSlug ).filter(
		placement => settings[ placement.option ]
	);

	if ( ! enabled.length ) {
		return null;
	}

	// Inline styles, since the editor canvas iframe doesn't load the block's editor stylesheet.
	const noticeStyle: React.CSSProperties = {
		boxSizing: 'border-box',
		marginBlock: '24px',
		marginInline: 'auto',
		maxWidth: '640px',
		padding: '12px 16px',
		border: `1px dashed ${ colorStudio.colors[ 'Gray 40' ] }`,
		borderRadius: '2px',
		background: colorStudio.colors.White,
		color: colorStudio.colors[ 'Gray 90' ],
		fontFamily: 'system-ui, sans-serif',
		fontSize: '13px',
		lineHeight: 1.5,
	};

	return (
		<div style={ noticeStyle } contentEditable={ false }>
			<strong>{ __( 'Added by Newsletter settings', 'jetpack' ) }</strong>
			<ul style={ { margin: '4px 0', paddingInlineStart: '20px' } }>
				{ enabled.map( ( placement ): JSX.Element => (
					<li key={ placement.option }>{ placement.label }</li>
				) ) }
			</ul>
			<a
				href={ getAdminUrl( 'admin.php?page=jetpack-newsletter&p=%2F%3Ftab%3Dsettings' ) }
				target="_blank"
				rel="noopener noreferrer"
				style={ { color: 'inherit' } }
			>
				{ __( 'Manage in Newsletter settings', 'jetpack' ) }
			</a>
		</div>
	);
}
