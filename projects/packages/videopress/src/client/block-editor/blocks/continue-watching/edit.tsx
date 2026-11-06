/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, Placeholder, RangeControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { VideoPressIcon } from '../video/components/icons';
import type { BlockEditProps } from '@wordpress/blocks';

export type ContinueWatchingAttributes = {
	show: 'continue' | 'recent';
	count: number;
};

/**
 * Continue Watching block edit component: the list is personal, so the canvas shows a placeholder.
 *
 * @param props               - Block edit props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attribute setter.
 * @return Edit component.
 */
export default function ContinueWatchingEdit( {
	attributes,
	setAttributes,
}: BlockEditProps< ContinueWatchingAttributes > ) {
	const isRecent = attributes.show === 'recent';
	return (
		<div { ...useBlockProps() }>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-videopress-pkg' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Show', 'jetpack-videopress-pkg' ) }
						value={ attributes.show }
						options={ [
							{ value: 'continue', label: __( 'Continue watching', 'jetpack-videopress-pkg' ) },
							{ value: 'recent', label: __( 'Recently watched', 'jetpack-videopress-pkg' ) },
						] }
						onChange={ ( show: ContinueWatchingAttributes[ 'show' ] ) => setAttributes( { show } ) }
					/>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Number of videos', 'jetpack-videopress-pkg' ) }
						value={ attributes.count }
						min={ 1 }
						max={ 24 }
						onChange={ count => setAttributes( { count: count ?? 8 } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<Placeholder
				icon={ VideoPressIcon }
				label={
					isRecent
						? __( 'Recently watched', 'jetpack-videopress-pkg' )
						: __( 'Continue watching', 'jetpack-videopress-pkg' )
				}
				instructions={ __(
					'Shows the signed-in viewer’s own videos. Signed-out visitors see nothing here.',
					'jetpack-videopress-pkg'
				) }
			/>
		</div>
	);
}
