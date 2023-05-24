import { InspectorControls, useBlockProps, InnerBlocks, RichText } from '@wordpress/block-editor';
import { PanelBody, TextControl, SelectControl, Button } from '@wordpress/components';
import { useEntityRecord } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import './editor.scss';
import { useEffect, useState } from 'react';

function useCookieConsentTemplatePart() {
	const theme = useSelect( select => select( 'core' ).getCurrentTheme() );
	const { record, isResolving } = useEntityRecord(
		'postType',
		'wp_template_part',
		`${ theme?.stylesheet }//cookie-consent-block`,
		{
			enabled: !! theme,
		}
	);
	return { part: record, isLoading: ! theme || isResolving };
}
/**
 * Cookie Consent Edit Component.
 *
 * @param {object} props - Component props.
 * @param {object} props.attributes	- {object} Block attributes.
 * @param {Function} props.setAttributes - Set block attributes.
 * @param {string} props.clientId - the client id of the block.
 * @returns {object} Element to render.
 */
function CookieConsentBlockEdit( { clientId, attributes, setAttributes } ) {
	const parentPostSlug = useSelect( select => {
		const id = select( 'core/edit-site' ).getEditedPostId();
		const type = select( 'core/edit-site' ).getEditedPostType();
		return select( 'core' ).getEntityRecord( 'postType', type, id );
	}, [] );

	const { removeBlock } = useDispatch( 'core/block-editor' );
	const { saveEntityRecord } = useDispatch( 'core' );
	const [ isSaving, setIsSaving ] = useState( false );

	const { part, isLoading } = useCookieConsentTemplatePart();

	const [ mode, setMode ] = useState( 'LOADING' );

	/**
	 * This replicates the shape of the block. It should be updated if the block changes.
	 */
	const defaultPart = {
		slug: 'cookie-consent-block',
		inserter: false,
		description: 'hello',
		scope: [],
		title: {
			raw: __( 'Cookie Consent Block', 'jetpack' ),
		},
		content: `<!-- wp:jetpack/cookie-consent -->
		<div class="wp-block-jetpack-cookie-consent align${
			attributes.align
		} has-text-color has-background has-text-color has-background" style="color:var(--wp--preset--color--contrast);background-color:var(--wp--preset--color--tertiary);padding-top:1em;padding-right:1em;padding-bottom:1em;padding-left:1em" role="dialog" aria-modal="true"><p>${
			attributes.text
		}</p><!-- wp:button -->
		<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">${ __(
			'Accept',
			'jetpack'
		) }</a></div>
		<!-- /wp:button --><span>${ attributes.consentExpiryDays }</span></div>
		<!-- /wp:jetpack/cookie-consent -->`,
		area: 'footer',
	};

	useEffect( () => {
		if ( part && ! isLoading ) {
			setMode( 'PART_EXISTS' );
		} else if ( ! part && ! isLoading ) {
			setMode( 'PART_DOES_NOT_EXIST' );
		}
	}, [ part, isLoading ] );

	const { consentExpiryDays, align, text } = attributes;

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

	async function goToTemplatePart( savedTemplate ) {
		setIsSaving( false );
		removeBlock( clientId );
		window.open(
			`/wp-admin/site-editor.php?postType=${ savedTemplate.type }&postId=${ savedTemplate.id }`
		);
	}

	const blockProps = useBlockProps( {
		className: `wp-block-jetpack-cookie-consent align${ align }`,
	} );

	if ( parentPostSlug?.slug !== 'cookie-consent-block' ) {
		if ( mode === 'LOADING' ) {
			return 'Loading...';
		} else if ( mode === 'PART_EXISTS' ) {
			return (
				<div>
					<p>
						{ __(
							'Cookie Consent Block is best added as a template part. Luckily, you already have created a template part before!',
							'jetpack'
						) }
					</p>
					<Button
						variant="primary"
						disabled={ isSaving }
						onClick={ () => {
							setIsSaving( true );
							goToTemplatePart( part );
						} }
					>
						{ __( 'Go to part', 'jetpack' ) }
					</Button>
				</div>
			);
		} else if ( mode === 'PART_DOES_NOT_EXIST' ) {
			return (
				<div>
					<p>
						{ __(
							'Cookie Consent Block is best added as a template part. We can do that for you!',
							'jetpack'
						) }
					</p>
					<Button
						variant="primary"
						disabled={ isSaving }
						onClick={ () => {
							saveEntityRecord( 'postType', 'wp_template_part', defaultPart )
								.then( goToTemplatePart )
								.catch( () => {
									setIsSaving( false );
								} );
						} }
					>
						{ __( 'Create the template part', 'jetpack' ) }
					</Button>
				</div>
			);
		}
	}
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
