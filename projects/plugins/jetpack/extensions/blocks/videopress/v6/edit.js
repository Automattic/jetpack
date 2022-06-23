/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	useBlockProps,
	BlockIcon,
	MediaPlaceholder,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl, Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { VideoPressIcon as icon } from '../../../shared/icons';

const ALLOWED_MEDIA_TYPES = [ 'video' ];

// @Todo: replace with uploading implementation.
const noop = () => {};

export default function VideoPressEdit( props ) {
	const { attributes, setAttributes } = props;
	const { controls, src } = attributes;
	const blockProps = useBlockProps( {
		className: 'wp-block-jetpack-videopress',
	} );

	const renderControlLabelWithTooltip = ( label, tooltipText ) => {
		return (
			<Tooltip text={ tooltipText } position="top">
				<span>{ label }</span>
			</Tooltip>
		);
	};

	const handleAttributeChange = attributeName => {
		return newValue => {
			setAttributes( { [ attributeName ]: newValue } );
		};
	};

	const blockSettings = (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Video Settings', 'jetpack' ) }>
					<ToggleControl
						label={ renderControlLabelWithTooltip(
							__( 'Playback Controls', 'jetpack' ),
							/* translators: Tooltip describing the "controls" option for the VideoPress player */
							__( 'Display the video playback controls', 'jetpack' )
						) }
						onChange={ handleAttributeChange( 'controls' ) }
						checked={ controls }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);

	if ( ! src ) {
		return (
			<>
				{ blockSettings }
				<div { ...blockProps }>
					<MediaPlaceholder
						icon={ <BlockIcon icon={ icon } /> }
						labels={ {
							title: __( 'VideoPress', 'jetpack' ),
						} }
						onSelect={ noop }
						onSelectURL={ noop }
						accept="video/*"
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						value={ attributes }
						onError={ noop }
					/>
				</div>
			</>
		);
	}

	return <div { ...blockProps }>{ __( 'VideoPress', 'jetpack' ) }</div>;
}
