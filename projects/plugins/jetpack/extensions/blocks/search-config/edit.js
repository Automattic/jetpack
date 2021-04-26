/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Card, SelectControl, ToggleControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './editor.scss';

export default function SearchConfigEdit( { className } ) {
	/**
	 * @returns {object} The UI displayed when user edits this block.
	 */
	const site = useSelect( select => select( 'core' ).getSite() );
	const [ theme, setTheme ] = useEntityProp( 'root', 'site', 'jetpack_search_color_theme' );
	const [ resultFormat, setResultFormat ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_result_format'
	);
	const [ sort, setSort ] = useEntityProp( 'root', 'site', 'jetpack_search_default_sort' );
	const [ trigger, setTrigger ] = useEntityProp( 'root', 'site', 'jetpack_search_overlay_trigger' );
	// TODO: Fix and re-enable.
	// const [ color, setColor ] = useEntityProp( 'root', 'site', 'jetpack_search_highlight_color' );
	const [ sortEnabled, setSortEnabled ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_enable_sort'
	);
	const [ infiniteScroll, setInfiniteScroll ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_inf_scroll'
	);
	const [ showLogo, setShowLogo ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_show_powered_by'
	);

	// TODO: Create control for jetpack_search_excluded_post_types.

	return (
		<div className={ className }>
			<Card>
				<h3>{ __( 'Search Configurator 1000', 'jetpack' ) }</h3>
				<SelectControl
					disabled={ ! site }
					label="Theme"
					value={ theme }
					options={ [
						{ label: __( 'Light', 'jetpack' ), value: 'light' },
						{ label: __( 'Dark', 'jetpack' ), value: 'dark' },
					] }
					onChange={ setTheme }
				/>
				<SelectControl
					disabled={ ! site }
					label="Result Format"
					value={ resultFormat }
					options={ [
						{ label: __( 'Minimal', 'jetpack' ), value: 'minimal' },
						{ label: __( 'Expanded (shows images)', 'jetpack' ), value: 'expanded' },
						{ label: __( 'Product (for WooCommerce stores)', 'jetpack' ), value: 'product' },
					] }
					onChange={ setResultFormat }
				/>
				<SelectControl
					disabled={ ! site }
					label="Sort"
					value={ sort }
					options={ [
						{ label: __( 'Relevance (recommended)', 'jetpack' ), value: 'relevance' },
						{ label: __( 'Newest first', 'jetpack' ), value: 'newest' },
						{ label: __( 'Oldest first', 'jetpack' ), value: 'oldest' },
					] }
					onChange={ setSort }
				/>
				<SelectControl
					disabled={ ! site }
					label="Overlay Trigger"
					value={ trigger }
					options={ [
						{ label: __( 'Open when the user starts typing', 'jetpack' ), value: 'immediate' },
						{ label: __( 'Open when results are available', 'jetpack' ), value: 'results' },
					] }
					onChange={ setTrigger }
				/>
				{ /* TODO: Fix the ColorPicker implementation */ }
				{ /* <ColorPicker color={ color } onChangeComplete={ value => setColor( value.hex ) } /> */ }
				<ToggleControl
					checked={ sortEnabled }
					disabled={ ! site }
					label="Enable Sort"
					onChange={ setSortEnabled }
				/>
				<ToggleControl
					checked={ infiniteScroll }
					disabled={ ! site }
					label="Enable Infinite Scroll"
					onChange={ setInfiniteScroll }
				/>
				<ToggleControl
					checked={ showLogo }
					disabled={ ! site }
					label="Show 'Powered by Jetpack'"
					onChange={ setShowLogo }
				/>
			</Card>
		</div>
	);
}
