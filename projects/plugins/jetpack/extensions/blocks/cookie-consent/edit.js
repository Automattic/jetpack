import { InspectorControls, useBlockProps, InnerBlocks, RichText } from '@wordpress/block-editor';
import { PanelBody, TextControl, SelectControl } from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import './editor.scss';
import { DEFAULT_TEXT } from './constants';
import { useSaveCookieConsentSettings } from './use-save-cookie-consent-settings';

/**
 * Cookie Consent Edit Component.
 *
 * @param {object} props - Component props.
 * @param {string} props.clientId - Block id
 * @param {object} props.attributes	- {object} Block attributes.
 * @param {Function} props.setAttributes - Set block attributes.
 * @returns {object} Element to render.
 */
function CookieConsentBlockEdit( { clientId, attributes, setAttributes } ) {
	const { consentExpiryDays, align, text = DEFAULT_TEXT } = attributes;

	useSaveCookieConsentSettings( clientId );
	/**
	 * Update the alignment of the block. This takes care setting names alignments (left, right, etc..) or eg width=500.
	 *
	 * @param {string} nextAlign - The new alignment.
	 */
	function updateAlignment( nextAlign ) {
		const extraUpdatedAttributes = [ 'wide', 'full' ].includes( nextAlign )
			? { width: undefined, height: undefined }
			: {};
		setAttributes( {
			...extraUpdatedAttributes,
			align: nextAlign,
		} );
	}

	const blockProps = useBlockProps( {
		className: `wp-block-jetpack-cookie-consent align${ align }`,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Block Settings', 'jetpack' ) }>
					<SelectControl
						label={ __( 'Alignment', 'jetpack' ) }
						value={ align }
						options={ [
							{
								label: isRTL() ? __( 'Right', 'jetpack' ) : __( 'Left', 'jetpack' ),
								value: 'left',
							},
							{
								label: __( 'Full', 'jetpack' ),
								value: 'full',
							},
							{
								label: __( 'Wide', 'jetpack' ),
								value: 'wide',
							},
							{
								label: isRTL() ? __( 'Left', 'jetpack' ) : __( 'Right', 'jetpack' ),
								value: 'right',
							},
						] }
						onChange={ alignValue => updateAlignment( alignValue ) }
					/>
					<TextControl
						label={ __( 'Consent Expiry Time (in days)', 'jetpack' ) }
						value={ consentExpiryDays }
						type="number"
						min="1"
						max="365"
						onChange={ value => setAttributes( { consentExpiryDays: parseInt( value ) } ) }
					/>
					<p>
						{ __(
							'Note: The block position in the editor is not indicative of the position on the front end. The block will always be positioned at the bottom of the page.',
							'jetpack'
						) }
					</p>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps } style={ blockProps.style }>
				<RichText
					tagName="p"
					value={ text }
					onChange={ textValue => setAttributes( { text: textValue } ) }
				/>
				<InnerBlocks
					allowedBlocks={ [ 'core/button' ] }
					template={ [
						[
							'core/button',
							{
								text: __( 'Accept', 'jetpack' ),
							},
						],
					] }
					templateLock="all"
				></InnerBlocks>
			</div>
		</>
	);
}

export default CookieConsentBlockEdit;
