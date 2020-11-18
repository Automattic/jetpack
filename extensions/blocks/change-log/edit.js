
/**
 * External dependencies
 */
import { map } from 'lodash';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';
import { Dropdown, Button, NavigableMenu, MenuItem, MenuGroup, TextControl, BaseControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';

const LOG_TEMPLATE = [
	[ 'core/paragraph', { placeholder: __( 'Start logging…', 'Jetpack' ) } ],
    ];

const LabelsDropdown = ( {
	className,
	labels,
	value,
	onSelect,

	custom,
	onCustom,
} ) => {
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
								{ map( labels, ( name ) => (
									<MenuItem key={ name } onClick={ () => onSelect( name ) }>
										{ name }
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
	 'Alarm',
	 'Warning',
	 'Normal',
];

export default function ChangelogEdit ( {
	className,
	attributes,
	setAttributes,
} ) {
	const { value = '', custom = '' } = attributes;

	return (
		<div class={ className }>
			<LabelsDropdown
				className={ `${ className }__labels-dropdown` }
				labels={ defaultLabels }

				value={ value || defaultLabels[ 0 ] }
				onSelect={ ( newValue ) => setAttributes( { value: newValue } ) }

				custom={ custom }
				onCustom={ ( newCustom ) => setAttributes( { custom: newCustom } ) }
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
