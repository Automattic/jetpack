
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
	__experimentalNumberControl as NumberControl,
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

function TimeStamp ( { value, className, onChange } ) {
	const msh = value.split( ':' );

	function setTimeStampValue( pos, val ) {
		val = String( val );
		msh[ pos ] = val?.length === 1 ? `0${ val }` : val;
		onChange( msh.join( ':' ) );
	}

	return (
		<div className={ className }>
			<NumberControl
				className={ `${ className }__minute` }
				label={ __( 'Minute', 'jetpack' ) }
				value={ msh[ 0 ] }
				min={ 0 }
				max={ 23 }
				onChange={ ( sec ) => setTimeStampValue( 0, sec ) }
			/>

			<NumberControl
				className={ `${ className }__second` }
				label={ __( 'Second', 'jetpack' ) }
				value={ msh[1] }
				min={ 0 }
				max={ 59 }
				onChange={ ( min ) => setTimeStampValue( 1, min ) }
			/>
		</div>
	);
}

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
	const { labelSlug, custom, showTimeStamp, timeStamp } = attributes;
	const labelsFromContext = context[ 'change-log/labels' ];
	const showTimeStampFromContext = context[ 'change-log/showTimeStamp' ];
	const labels = labelsFromContext?.length ? labelsFromContext : defaultLabels;

	return (
		<div class={ className }>
			<InspectorControls>
				<Panel>
					<PanelBody title={ __( 'Settings', 'jetpack' ) }>
						<ToggleControl
							label={ __( 'Show time stamp', 'jetpack' ) }
							checked={  showTimeStamp }
							onChange={
								( nowShowTimeStamp ) => setAttributes( { showTimeStamp: nowShowTimeStamp } )
							}
						/>

						{ showTimeStamp && (
							<TimeStamp
								className={ `${ className }__timestamp-control` }
								value={ timeStamp }
								onChange={ ( value ) => setAttributes( { timeStamp: value } ) }
							/>
						) }
					</PanelBody>
				</Panel>
			</InspectorControls>

			<div class={ `${ className }__meta` }>
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

				{ ( showTimeStampFromContext || showTimeStamp ) && (
					<div className={ `${ className }__timestamp` }>
						{ timeStamp }
					</div>
				) }
			</div>

			<InnerBlocks
				template={ LOG_TEMPLATE }
				allowedBlocks={ [ 'core/paragraph' ] }
				orientation="horizontal"
			/>
		</div>
	);
}

export default compose(
	withColors( 'backgroundColor', 'textColor' )
)( ChangelogEdit );
