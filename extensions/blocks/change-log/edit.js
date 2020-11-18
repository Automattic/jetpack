
/**
 * External dependencies
 */
import { map, find } from 'lodash';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks, withColors } from '@wordpress/block-editor';
import {
	Dropdown,
	Button,
	NavigableMenu,
	MenuItem,
	MenuGroup,
	TextControl,
	BaseControl,
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
	const currentLabel = find( labels, ( label ) => label.slug === slug ) || {};
	const value = slug && currentLabel?.value ? currentLabel.value : custom;

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
						{ value }
					</Button>
				) }
				renderContent={ () => {
					return (
						<NavigableMenu>
							<MenuGroup>
								{ map( labels, ( { value: labelValue, slug: labelSlug, textColor, bgColor } ) => (
									<MenuItem
										key={ labelSlug }
										onClick={ () => onSelect( labelSlug ) }
										style={ { color: textColor, backgroundColor: bgColor } }
									>
										{ labelValue }
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
		name: __( 'Alarm', 'jetpack' ),
		slug: 'label-0',
	},
	{
		name: __( 'Warning', 'jetpack' ),
		slug: 'label-1',
	},
	{
		name: __( 'Normal', 'jetpack' ),
		slug: 'label-2',
	},
];

function ChangelogEdit ( {
	className,
	attributes,
	setAttributes,
	context,
} ) {
	const { labelSlug, custom } = attributes;
	const labelsFromContext = context[ 'change-log/labels' ];
	const labels = labelsFromContext ? labelsFromContext : defaultLabels;

	return (
		<div class={ className }>
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
