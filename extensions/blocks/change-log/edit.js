
/**
 * External dependencies
 */
import { map, find } from 'lodash';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks, withColors, InspectorControls } from '@wordpress/block-editor';
import {
	Dropdown,
	Button,
	NavigableMenu,
	MenuItem,
	MenuGroup,
	TextControl,
	BaseControl,
	Panel,
	PanelBody,
	ToggleControl,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import './editor.scss';

const LOG_TEMPLATE = [
	[ 'core/paragraph', { placeholder: __( 'Start logging…', 'Jetpack' ) } ],
];

const LabelsSelector = ( {
	className,
	labels,
	slug,
	onSelect,

	custom,
	onCustom,
} ) => {
	const currentLabelBySlug = find( labels, ( label ) => label.slug === slug );
	const currentLabel = slug && currentLabelBySlug ? currentLabelBySlug : labels[ 0 ];
	const currentValue = ! slug && custom ? custom : currentLabel.value;

	return (
		<div className={ className }>
			<Dropdown
				position="bottom"
				contentClassName={ className }
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						onClick={ onToggle } aria-expanded={ isOpen }
						style={ { color: currentLabel.textColor, backgroundColor: currentLabel.bgColor } }
					>
						{ currentValue }
					</Button>
				) }
				renderContent={ () => {
					return (
						<NavigableMenu>
							<MenuGroup>
								{ map( labels, ( { value, slug: labelSlug, textColor, bgColor } ) => (
									<MenuItem
										key={ labelSlug }
										onClick={ () => onSelect( labelSlug ) }
										style={ { color: textColor, backgroundColor: bgColor } }
									>
										{ value }
									</MenuItem>
								) ) }
							</MenuGroup>

							<BaseControl
								className={ `${ className }__custom-label` }
								label={ __( 'Custom', 'jetpack' ) }
							>
								<div className={ `${ className }__text-button-container` }>
									<TextControl
										value={ custom }
										onChange={ ( newCustom ) => {
											onSelect( newCustom );
											onCustom( newCustom );
										} }
									/>
								</div>
							</BaseControl>
						</NavigableMenu>
					);
				} }
			/>
		</div>
	);
};

const defaultLabels = [
	{
		value: __( 'urgent', 'jetpack' ),
		slug: 'label-0',
		textColor: '#fff',
		bgColor: '#f06',
	},
	{
		value: __( 'warning', 'jetpack' ),
		slug: 'label-1',
		textColor: '#fff',
		bgColor: '#eb3',
	},
	{
		value: __( 'normal', 'jetpack' ),
		slug: 'label-2',
		textColor: '#fff',
		bgColor: '#0a6',
	},
];

function ChangelogEdit ( {
	className,
	attributes,
	setAttributes,
	context,
} ) {
	const { labelSlug, custom, showTimeStamp } = attributes;
	const labelsFromContext = context[ 'change-log/labels' ];
	const labels = labelsFromContext?.length ? labelsFromContext : defaultLabels;

	return (
		<div class={ className }>
			<InspectorControls>
				<Panel>
					<PanelBody title={ __( 'Settings', 'jetpacl' )}>
						<ToggleControl
							label={ __( 'Show time stamp', 'jetpack' ) }
							checked={ showTimeStamp }
							onChange={
								( nowShowTimeStamp ) => setAttributes( { showTimeStamp: nowShowTimeStamp } )
							}
						/>
					</PanelBody>
				</Panel>
			</InspectorControls>
			<LabelsSelector
				className={ `${ className }__labels-selector` }
				labels={ labels }

				slug={ labelSlug }
				onSelect={ ( newSlug ) => setAttributes( { labelSlug: newSlug } ) }

				custom={ custom }
				onCustom={ ( newCustom ) => setAttributes( {
					labelSlug: null,
					custom: newCustom,
				} ) }
			/>
			<InnerBlocks
				template={ LOG_TEMPLATE }
				allowedBlocks={ [ 'core/paragraph' ] }
				templateLock="all"
				orientation="horizontal"
			/>
		</div>
	);
}

export default compose(
	withColors( 'backgroundColor', 'textColor' )
)( ChangelogEdit );
