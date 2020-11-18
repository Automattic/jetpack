
/**
 * External dependencies
 */
import { map, find } from 'lodash';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';
import {
	Dropdown,
	Button,
	NavigableMenu,
	MenuItem,
	MenuGroup,
	TextControl,
	BaseControl,
} from '@wordpress/components';

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
	const valueFromSlug = find( labels, ( label ) => label.slug === slug )?.value;
	const value = slug && valueFromSlug ? valueFromSlug : custom;

	return (
		<div className={ className }>
			<Dropdown
				position="bottom"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button isPrimary onClick={ onToggle } aria-expanded={ isOpen }>
						{ value }
					</Button>
				) }
				renderContent={ () => {
					return (
						<NavigableMenu>
							<MenuGroup>
								{ map( labels, ( { value: labelValue, slug: labelSlug } ) => (
									<MenuItem key={ labelSlug } onClick={ () => onSelect( labelSlug ) }>
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
		color: 'red',
		slug: 'label-0',
	},
	{
		name: __( 'Warning', 'jetpack' ),
		color: 'yellow',
		slug: 'label-0',
	},
	{
		name: __( 'Normal', 'jetpack' ),
		color: 'green',
		slug: 'label-0',
	},
];

export default function ChangelogEdit ( {
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
				className={ `${ className }__labels-dropdown` }
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
