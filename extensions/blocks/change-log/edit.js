
/**
 * External dependencies
 */
import classNames from 'classnames';
import { map } from 'lodash';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';
import { Dropdown, Button, NavigableMenu, MenuItem, MenuGroup, TextControl, BaseControl } from '@wordpress/components';

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
		<Dropdown
			className={ className }
			contentClassName="my-popover-content-classname"
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
							label={ __( 'Custom label', 'jetpack' ) }
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
