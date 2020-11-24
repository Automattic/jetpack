
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, RichText } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
	Panel,
	PanelBody,
	ToggleControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import LabelsDropdown from './components/labels-dropdown';
import TimeStampControl from './components/time-stamp-control';

const blockName = 'jetpack/changelog';
const fallbackBlockName = 'core/paragraph';

const defaultLabels = [
	{
		value: __( 'new', 'jetpack' ),
		slug: 'new',
	},
	{
		value: __( 'improved', 'jetpack' ),
		slug: 'improved',
	},
	{
		value: __( 'fixed', 'jetpack' ),
		slug: 'fixed',
	},
];

export default function ChangelogEdit ( {
	className,
	attributes,
	setAttributes,
	mergeBlocks,
	onReplace,
	instanceId,
} ) {
	const {
		label,
		labelSlug,
		showTimeStamp,
		timeStamp,
		content,
		placeholder,
	} = attributes;

	return (
		<div class={ className }>
			<InspectorControls>
				<Panel>
					<PanelBody title={ __( 'Settings', 'jetpack' ) }>
						<ToggleControl
							label={ __( 'Show time stamp', 'jetpack' ) }
							checked={ showTimeStamp }
							onChange={
								( show ) => setAttributes( { showTimeStamp: show } )
							}
						/>

						{ showTimeStamp && (
							<TimeStampControl
								className={ `${ className }__timestamp-control` }
								value={ timeStamp }
								onChange={ ( newTimeStampValue ) => {
									setAttributes( { timeStamp: newTimeStampValue } );
								} }
							/>
						) }
					</PanelBody>
				</Panel>
			</InspectorControls>

			<div class={ `${ className }__meta` }>
				<LabelsDropdown
					id={ `changelog-${ instanceId }-labels-selector` }
					className={ className }
					labels={ defaultLabels }
					value={ label }
					slug={ labelSlug }
					onSelect={ ( { newLabel, newLabelSlug } ) => {
						setAttributes( {
							labelSlug: newLabelSlug,
							label: newLabel,
						} );
					 } }
					onChange={ ( { newLabel, newLabelSlug } ) => setAttributes( {
						labelSlug: newLabelSlug,
						label: newLabel,
					} ) }
				/>

				{ showTimeStamp && (
					<div className={ `${ className }__timestamp` }>
						{ timeStamp }
					</div>
				) }
			</div>

			<RichText
				identifier="content"
				wrapperClassName="wp-block-p2-changelog__content"
				value={ content }
				onChange={ ( value ) =>
					setAttributes( { content: value } )
				}
				onMerge={ mergeBlocks }
				onSplit={ ( value ) => {
					if ( ! content.length ) {
						return createBlock( fallbackBlockName );
					}

					if ( ! value ) {
						return createBlock( blockName );
					}

					return createBlock( blockName, {
						...attributes,
						content: value,
					} );
				} }
				onReplace={ onReplace }
				onRemove={
					onReplace ? () => onReplace( [] ) : undefined
				}
				placeholder={ placeholder || __( 'Add entry' ) }
			/>
		</div>
	);
}
