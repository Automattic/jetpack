/**
 * External dependencies
 */
import { find } from 'lodash';

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
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './editor.scss';
import SpeakersDropdown from './components/speakers-dropdown';
import TimeStampControl from './components/time-stamp-control';

const blockName = 'jetpack/dialogue';
const fallbackBlockName = 'core/paragraph';

const defaultSpeakers = [
	{
		speaker: __( 'Speaker One', 'jetpack' ),
		speakerSlug: 'speaker-0',
	},
	{
		speaker: __( 'Speaker Two', 'jetpack' ),
		speakerSlug: 'speaker-1',
	},
	{
		speaker: __( 'Speaker Three', 'jetpack' ),
		speakerSlug: 'speaker-2',
	},
];

export default function DialogueEdit ( {
	className,
	attributes,
	setAttributes,
	mergeBlocks,
	onReplace,
	instanceId,
	context,
} ) {
	const {
		speaker,
		speakerSlug,
		showTimeStamp,
		timeStamp,
		content,
		placeholder,
	} = attributes;

	// Block context integration.
	const speakersFromContext = context[ 'dialogue/speakers' ];

	// Follow lables changes when block context changes.
	useEffect( () => {
		if ( ! speakersFromContext ) {
			return;
		}

		const speakerBySlug = find( speakersFromContext, ( contextSpeaker ) => contextSpeaker.speakerSlug === speakerSlug );
		if ( ! speakerBySlug ) {
			return;
		}

		setAttributes( {
			speakerSlug: speakerBySlug.speakerSlug,
			speaker: speakerBySlug.speaker,
		} );
	}, [ speakerSlug, speakersFromContext, setAttributes ] );

	const speakers = speakersFromContext?.length ? speakersFromContext : defaultSpeakers;

	return (
		<div class={ className }>
			<InspectorControls>
				<Panel>
					<PanelBody title={ __( 'Timestamp', 'jetpack' ) }>
						<ToggleControl
							label={ __( 'Show', 'jetpack' ) }
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
				<SpeakersDropdown
					id={ `dialogue-${ instanceId }-speakers-selector` }
					className={ className }
					speakers={ speakers }
					speaker={ speaker }
					slug={ speakerSlug }
					onSelect={ ( { newSpeaker, newSpeakerSlug } ) => {
						setAttributes( {
							speakerSlug: newSpeakerSlug,
							speaker: newSpeaker,
						} );
					 } }
					onChange={ ( { newSpeaker, newSpeakerSlug } ) => setAttributes( {
						speakerSlug: newSpeakerSlug,
						speaker: newSpeaker,
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
				wrapperClassName="wp-block-p2-dialogue__content"
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
