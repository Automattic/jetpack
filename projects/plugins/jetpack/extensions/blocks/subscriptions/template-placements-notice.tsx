import colorStudio from '@automattic/color-studio';
import { getAdminUrl } from '@automattic/jetpack-script-data';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';

interface Placement {
	label: string;
	option: string;
}

const getSettingsPlacements = (): Placement[] => [
	{
		option: 'jetpack_subscribe_overlay_enabled',
		label: __( 'Subscription overlay on homepage', 'jetpack' ),
	},
	{
		option: 'sm_enabled',
		label: __( 'Subscription pop-up in post', 'jetpack' ),
	},
	{
		option: 'jetpack_subscribe_floating_button_enabled',
		label: __( 'Floating button on bottom corner', 'jetpack' ),
	},
];

// Rendered after the footer in the editor only; BlockEdit output is never saved.
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
 * Lists the Newsletter placements enabled on the site while a template is being edited.
 *
 * @return {JSX.Element|null} The notice element, or null if no placements are enabled.
 */
function TemplatePlacementsNotice() {
	const isTemplate = useSelect(
		select => select( editorStore ).getCurrentPostType() === 'wp_template',
		[]
	);
	const settings = window?.Jetpack_Editor_Initial_State?.jetpack?.subscribe_placements;

	if ( ! isTemplate || ! settings ) {
		return null;
	}

	const enabled = getSettingsPlacements().filter( placement => settings[ placement.option ] );

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
				style={ { color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '2px' } }
			>
				{ __( 'Manage in Newsletter settings', 'jetpack' ) }
				<Icon icon={ external } size={ 16 } style={ { fill: 'currentColor' } } />
			</a>
		</div>
	);
}
