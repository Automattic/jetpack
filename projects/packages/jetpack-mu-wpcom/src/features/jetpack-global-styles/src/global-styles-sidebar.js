import { Button, PanelBody } from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import { PluginSidebar, PluginSidebarMoreMenuItem } from '@wordpress/edit-post';
import { useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { typography } from '@wordpress/icons';
import { getQueryArg } from '@wordpress/url';
import { FONT_BASE, FONT_HEADINGS } from './constants';
import FontPairingsPanel from './font-pairings-panel';
import FontSelectionPanel from './font-selection-panel';

const ANY_PROPERTY = 'ANY_PROPERTY';

const isFor = filterProperty => option =>
	option.prop === ANY_PROPERTY || option.prop === filterProperty;

const toOption = font => {
	if ( typeof font === 'object' ) {
		const { label, value, prop = ANY_PROPERTY } = font;
		return { label, value, prop };
	}
	return { label: font, value: font, prop: ANY_PROPERTY };
};
const isNotNull = option => option.value !== null && option.label !== null;

const toOptions = ( options, filterProperty ) =>
	! options ? [] : options.map( toOption ).filter( isNotNull ).filter( isFor( filterProperty ) );

const PanelActionButtons = ( {
	hasLocalChanges,
	resetAction,
	publishAction,
	className = null,
} ) => (
	<div className={ className }>
		<Button disabled={ ! hasLocalChanges } isDefault onClick={ resetAction }>
			{ __( 'Reset', 'jetpack-mu-wpcom' ) }
		</Button>
		<Button
			className="global-styles-sidebar__publish-button"
			disabled={ ! hasLocalChanges }
			isPrimary
			onClick={ publishAction }
		>
			{ __( 'Publish', 'jetpack-mu-wpcom' ) }
		</Button>
	</div>
);

/**
 * Open the sidebar if the `openSidebar` query arg is set to `global-styles`.
 */
function maybeOpenSidebar() {
	const openSidebar = getQueryArg( window.location.href, 'openSidebar' );
	if ( 'global-styles' === openSidebar ) {
		dispatch( 'core/edit-post' ).openGeneralSidebar( 'jetpack-global-styles/global-styles' );
	}
}

export default ( {
	fontHeadings,
	fontHeadingsDefault,
	fontBase,
	fontBaseDefault,
	fontPairings,
	fontOptions,
	siteName,
	publishOptions,
	updateOptions,
	hasLocalChanges,
	resetLocalChanges,
} ) => {
	useEffect( () => {
		maybeOpenSidebar();
	}, [] );
	const publish = () =>
		publishOptions( {
			[ FONT_BASE ]: fontBase,
			[ FONT_HEADINGS ]: fontHeadings,
		} );
	return (
		<>
			<PluginSidebarMoreMenuItem icon={ typography } target="global-styles">
				{ __( 'Global Styles', 'jetpack-mu-wpcom' ) }
			</PluginSidebarMoreMenuItem>
			<PluginSidebar
				icon={ typography }
				name="global-styles"
				title={ __( 'Global Styles', 'jetpack-mu-wpcom' ) }
				className="global-styles-sidebar"
			>
				<PanelBody>
					<p>
						{
							/* translators: %s: Name of site. */
							sprintf( __( 'You are customizing %s.', 'jetpack-mu-wpcom' ), siteName )
						}
					</p>
					<p>
						{ __(
							'Any change you make here will apply to the entire website.',
							'jetpack-mu-wpcom'
						) }
					</p>
					{ hasLocalChanges ? (
						<div>
							<p>
								<em>{ __( 'You have unsaved changes.', 'jetpack-mu-wpcom' ) }</em>
							</p>
							<PanelActionButtons
								hasLocalChanges={ hasLocalChanges }
								publishAction={ publish }
								resetAction={ resetLocalChanges }
							/>
						</div>
					) : null }
				</PanelBody>
				<PanelBody title={ __( 'Font Selection', 'jetpack-mu-wpcom' ) }>
					<FontSelectionPanel
						fontBase={ fontBase }
						fontBaseDefault={ fontBaseDefault }
						fontHeadings={ fontHeadings }
						fontHeadingsDefault={ fontHeadingsDefault }
						fontBaseOptions={ toOptions( fontOptions, FONT_BASE ) }
						fontHeadingsOptions={ toOptions( fontOptions, FONT_HEADINGS ) }
						updateBaseFont={ value => updateOptions( { [ FONT_BASE ]: value } ) }
						updateHeadingsFont={ value => updateOptions( { [ FONT_HEADINGS ]: value } ) }
					/>
					<FontPairingsPanel
						fontHeadings={ fontHeadings }
						fontBase={ fontBase }
						fontPairings={ fontPairings }
						update={ ( { headings, base } ) =>
							updateOptions( { [ FONT_HEADINGS ]: headings, [ FONT_BASE ]: base } )
						}
					/>
				</PanelBody>
				<PanelBody>
					{ hasLocalChanges ? (
						<p>
							<em>{ __( 'You have unsaved changes.', 'jetpack-mu-wpcom' ) }</em>
						</p>
					) : null }
					<PanelActionButtons
						hasLocalChanges={ hasLocalChanges }
						publishAction={ publish }
						resetAction={ resetLocalChanges }
						className="global-styles-sidebar__panel-action-buttons"
					/>
				</PanelBody>
			</PluginSidebar>
		</>
	);
};
