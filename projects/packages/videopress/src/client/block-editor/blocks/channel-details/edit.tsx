/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { CheckboxControl, Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import ServerPreview from '../../channel/server-preview';
/**
 * Types
 */
import type { BlockEditProps } from '@wordpress/blocks';

export type ChannelItem = 'handle' | 'subscribers' | 'videos' | 'playlists' | 'views' | 'joined';

export type ChannelDetailsAttributes = {
	items: ChannelItem[];
	layout: 'inline' | 'list';
};

const ITEM_LABELS: Record< ChannelItem, string > = {
	handle: __( 'Handle', 'jetpack-videopress-pkg' ),
	subscribers: __( 'Subscribers', 'jetpack-videopress-pkg' ),
	videos: __( 'Videos', 'jetpack-videopress-pkg' ),
	playlists: __( 'Playlists', 'jetpack-videopress-pkg' ),
	views: __( 'Total views', 'jetpack-videopress-pkg' ),
	joined: __( 'Joined', 'jetpack-videopress-pkg' ),
};

/**
 * Channel Details block edit component.
 *
 * @param props               - Block edit props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attribute setter.
 * @return Edit component.
 */
export default function ChannelDetailsEdit( {
	attributes,
	setAttributes,
}: BlockEditProps< ChannelDetailsAttributes > ) {
	const { items, layout } = attributes;
	const toggle = ( item: ChannelItem, checked: boolean ) =>
		setAttributes( {
			items: ( Object.keys( ITEM_LABELS ) as ChannelItem[] ).filter( key =>
				key === item ? checked : items.includes( key )
			),
		} );

	return (
		<div { ...useBlockProps() }>
			<InspectorControls>
				<PanelBody title={ __( 'Details', 'jetpack-videopress-pkg' ) }>
					<Stack direction="column" gap="md">
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Layout', 'jetpack-videopress-pkg' ) }
							value={ layout }
							options={ [
								{ value: 'inline', label: __( 'One line', 'jetpack-videopress-pkg' ) },
								{ value: 'list', label: __( 'List with labels', 'jetpack-videopress-pkg' ) },
							] }
							onChange={ value =>
								setAttributes( { layout: value as ChannelDetailsAttributes[ 'layout' ] } )
							}
						/>
						<Stack direction="column" gap="sm">
							{ ( Object.keys( ITEM_LABELS ) as ChannelItem[] ).map( item => (
								<CheckboxControl
									key={ item }
									label={ ITEM_LABELS[ item ] }
									checked={ items.includes( item ) }
									onCheckedChange={ checked => toggle( item, checked ) }
								/>
							) ) }
						</Stack>
					</Stack>
				</PanelBody>
			</InspectorControls>
			<ServerPreview
				block="videopress/channel-details"
				attributes={ attributes }
				label={ __( 'Channel Details', 'jetpack-videopress-pkg' ) }
				emptyInstructions={ __( 'Pick at least one detail to show.', 'jetpack-videopress-pkg' ) }
			/>
		</div>
	);
}
