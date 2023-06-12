import { InspectorControls, useBlockProps, InnerBlocks, RichText } from '@wordpress/block-editor';
import { createBlock, serialize } from '@wordpress/blocks';
import {
	PanelBody,
	TextControl,
	SelectControl,
	Button,
	Card,
	CardBody,
	CardFooter,
} from '@wordpress/components';
import { useEntityRecord } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { __, isRTL } from '@wordpress/i18n';
import './editor.scss';
import { useEffect, useState } from 'react';
import { name as blockName } from '.';

const PART_SLUG = 'cookie-consent-block-template-part';

function createTemplatePart( attributes, innerBlocks ) {
	return {
		slug: PART_SLUG,
		description: __( 'Contains the cookie consent block.', 'jetpack' ),
		title: __( 'Cookie Consent Block Template Part', 'jetpack' ),
		content: serialize(
			createBlock(
				`jetpack/${ blockName }`,
				{
					...attributes,
					isInWarningState: false,
					lock: {
						move: true,
						remove: true,
					},
				},
				innerBlocks
			)
		),
		area: 'footer',
	};
}

/**
 * Hide the cookie consent block pattern from the inserter. It should not be inserted by the user, only edited or deleted.
 */
addFilter( 'blocks.registerBlockType', 'core/template-part', function ( settings, name ) {
	if ( name === 'core/template-part' ) {
		return {
			...settings,
			variations: settings.variations.map( variation => {
				if ( variation.name === PART_SLUG ) {
					return {
						...variation,
						// the original scope is ['inserter']
						scope: [],
					};
				}
				return variation;
			} ),
		};
	}
	return settings;
} );

/**
 * Fetches the template part for the cookie consent block
 *
 * @returns {object} { part, isLoading }
 */
function useCookieConsentTemplatePart() {
	const theme = useSelect( select => select( 'core' ).getCurrentTheme() );
	const { record, isResolving } = useEntityRecord(
		'postType',
		'wp_template_part',
		`${ theme?.stylesheet }//${ PART_SLUG }`,
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
	const parentPost = useSelect( select => {
		const id = select( 'core/edit-site' ).getEditedPostId();
		const type = select( 'core/edit-site' ).getEditedPostType();
		return select( 'core' ).getEntityRecord( 'postType', type, id );
	}, [] );

	const { removeBlock } = useDispatch( 'core/block-editor' );
	const { saveEntityRecord } = useDispatch( 'core' );
	const [ isSaving, setIsSaving ] = useState( false );

	const { part, isLoading } = useCookieConsentTemplatePart();
	const innerBlocks = useSelect(
		select => select( 'core/editor' ).getBlocks( clientId ),
		[ clientId ]
	);

	const templatePart = createTemplatePart( attributes, innerBlocks );

	/**
	 * mode: LOADING | PART_EXISTS | PART_DOES_NOT_EXIST
	 */
	const [ mode, setMode ] = useState( 'LOADING' );

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

	const isInWarningState = parentPost?.slug !== PART_SLUG;

	/* If the block is added in the right place (in its own part), mark it as such, this is needed in the save function */
	useEffect( () => {
		if ( parentPost ) {
			setAttributes( { isInWarningState } );
		}
	}, [ setAttributes, parentPost, isInWarningState ] );

	/* If the block is added in the wrong place (not in its own part), render UI that helps the user create a template part. */
	if ( isInWarningState ) {
		if ( mode === 'LOADING' ) {
			return __( 'Loading…', 'jetpack' );
		} else if ( mode === 'PART_EXISTS' ) {
			return (
				<>
					<div hidden>
						<RichText tagName="p" value={ text } />
					</div>
					<Card>
						<CardBody>
							<p>
								{ __(
									'You can only have one cookie consent banner on your site. To edit the one you already have, click the button below.',
									'jetpack'
								) }
							</p>
						</CardBody>
						<CardFooter>
							<Button
								variant="primary"
								disabled={ isSaving }
								onClick={ () => {
									setIsSaving( true );
									goToTemplatePart( part );
								} }
							>
								{ __( 'Go to template part', 'jetpack' ) }
							</Button>
						</CardFooter>
					</Card>
				</>
			);
		} else if ( mode === 'PART_DOES_NOT_EXIST' ) {
			return (
				<>
					<div hidden>
						<RichText tagName="p" value={ text } />
					</div>
					<Card>
						<CardBody>
							<p>
								{ __(
									'In order to be visible on every page of your site, the Cookie Consent Block should be added in its own template part.',
									'jetpack'
								) }
							</p>
						</CardBody>
						<CardFooter>
							<Button
								variant="primary"
								disabled={ isSaving }
								onClick={ () => {
									saveEntityRecord( 'postType', 'wp_template_part', templatePart )
										.then( goToTemplatePart )
										.catch( () => {
											setIsSaving( false );
										} );
								} }
							>
								{ __( 'Create the template part', 'jetpack' ) }
							</Button>
						</CardFooter>
					</Card>
				</>
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
