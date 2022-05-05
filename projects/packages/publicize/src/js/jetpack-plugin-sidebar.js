/**
 * External dependencies
 */
import { createSlotFill, SVG, Path, Polygon } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { PluginSidebar, PluginSidebarMoreMenuItem } from '@wordpress/edit-post';
import { registerPlugin } from '@wordpress/plugins';
import { dispatch } from '@wordpress/data';
import { getQueryArg } from '@wordpress/url';
import classNames from 'classnames';
import domReady from '@wordpress/dom-ready';
import colorStudio from '@automattic/color-studio';

/**
 * Internal dependencies
 */
import './jetpack-plugin-sidebar.scss';

const PALETTE = colorStudio.colors;

const JetpackLogo = ( {
	size = 24,
	border = 0,
	className,
	color = PALETTE[ 'Jetpack Green 40' ],
} ) => {
	const borderOffset = border ? ( -border / size ) * 32 : 0;

	return (
		<SVG
			className={ classNames( 'jetpack-logo', className ) }
			width={ size }
			height={ size }
			viewBox={ `${ borderOffset } ${ borderOffset } ${ 32 - borderOffset * 2 } ${
				32 - borderOffset * 2
			}` }
		>
			<Path
				className="jetpack-logo__icon-circle"
				fill={ color }
				stroke={ border ? '#fff' : 'transparent' }
				strokeWidth={ border }
				d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z"
			/>
			<Polygon
				className="jetpack-logo__icon-triangle"
				fill="#fff"
				points={ `15,19 ${ 7 - borderOffset * 0.5 },19 15,${ 3 - borderOffset }` }
			/>
			<Polygon
				className="jetpack-logo__icon-triangle"
				fill="#fff"
				points={ `17,${ 29 + borderOffset } 17,13 ${ 25 + borderOffset * 0.5 },13` }
			/>
		</SVG>
	);
};

const { Fill, Slot } = createSlotFill( 'JetpackPluginSidebar' );

export { Fill as default };

/**
 * Open Jetpack plugin sidebar by default when URL includes jetpackSidebarIsOpen=true.
 */
function openJetpackSidebar() {
	if ( getQueryArg( window.location.search, 'jetpackSidebarIsOpen' ) !== 'true' ) {
		return;
	}

	dispatch( 'core/interface' ).enableComplementaryArea(
		'core/edit-post',
		'jetpack-sidebar/jetpack'
	);
}
domReady( openJetpackSidebar );

registerPlugin( 'jetpack-sidebar', {
	render: () => (
		<Slot>
			{ fills => {
				if ( ! fills.length ) {
					return null;
				}

				return (
					<Fragment>
						<PluginSidebarMoreMenuItem target="jetpack" icon={ <JetpackLogo /> }>
							Jetpack
						</PluginSidebarMoreMenuItem>
						<PluginSidebar name="jetpack" title="Jetpack" icon={ <JetpackLogo /> }>
							{ fills }
						</PluginSidebar>
					</Fragment>
				);
			} }
		</Slot>
	),
} );
