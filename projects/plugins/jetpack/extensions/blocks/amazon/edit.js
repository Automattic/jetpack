import { ContrastChecker, InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import { getBlockDefaultClassName } from '@wordpress/blocks';
import {
	Button,
	ExternalLink,
	FormTokenField,
	PanelBody,
	Placeholder,
	ToggleControl,
	withNotices,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import tinycolor from 'tinycolor2';
import data from './dummy-data';
import icon from './icon';
import './editor.scss';

function AmazonEdit( {
	attributes: {
		backgroundColor,
		textColor,
		buttonAndLinkColor,
		asin,
		showImage,
		showTitle,
		showSeller,
		showPrice,
		showPurchaseButton,
	},
	className,
	name,
	noticeUI,
	setAttributes,
} ) {
	const defaultClassName = getBlockDefaultClassName( name );

	const [ suggestions, setSuggestions ] = useState( [] );
	const onInputChange = () => {
		// TODO get suggestions from API
		// It would be great if we didn't have to embed the ASIN like this but I think that
		// requires changes to core
		setSuggestions(
			data.products.map( dataProduct => `${ dataProduct.title } (ASIN:${ dataProduct.asin })` )
		);
	};

	const idRegex = /^(\d+)$|\(ASIN:(.+)\)$/;
	const onChange = selectedProducts => {
		// This code extracts the amazon ID from FormToken Field
		// We have to match the ID because FormTokenField only returns the value
		// of the field selected, rather than an associative key pair.
		// TODO improve/replace FormTokenField so that we can associate data
		// with each of the selected token.
		const selectedIds = selectedProducts.map( selectedProduct => {
			const parsed = idRegex.exec( selectedProduct );
			const selectedId = parsed[ 1 ] || parsed[ 2 ];
			return data.products.filter( filteredProduct => filteredProduct.asin === selectedId );
		} );
		setAttributes( { asin: selectedIds[ 0 ][ 0 ].asin } );
	};

	const blockPlaceholder = (
		<Placeholder
			label={ __( 'Amazon', 'jetpack' ) }
			instructions={ __( 'Search by entering an Amazon product name or ID below.', 'jetpack' ) }
			icon={ icon }
			notices={ noticeUI } // TODO
		>
			<form>
				<FormTokenField
					value={ asin }
					suggestions={ suggestions }
					onInputChange={ onInputChange }
					maxSuggestions={ 10 }
					label={ __( 'Products', 'jetpack' ) }
					onChange={ onChange }
				/>
				<Button variant="secondary" type="submit">
					{ __( 'Preview', 'jetpack' ) }
				</Button>
			</form>
		</Placeholder>
	);

	const inspectorControls = (
		<InspectorControls>
			{ asin && (
				<>
					<PanelBody title={ __( 'Promotion Settings', 'jetpack' ) }>
						<ToggleControl
							label={ __( 'Show Image', 'jetpack' ) }
							checked={ showImage }
							onChange={ () => setAttributes( { showImage: ! showImage } ) }
						/>
						<ToggleControl
							label={ __( 'Show Title', 'jetpack' ) }
							checked={ showTitle }
							onChange={ () => setAttributes( { showTitle: ! showTitle } ) }
						/>
						<ToggleControl
							label={ __( 'Show Author/Seller', 'jetpack' ) }
							checked={ showSeller }
							onChange={ () => setAttributes( { showSeller: ! showSeller } ) }
						/>
						<ToggleControl
							label={ __( 'Show Price', 'jetpack' ) }
							checked={ showPrice }
							onChange={ () => setAttributes( { showPrice: ! showPrice } ) }
						/>
						<ToggleControl
							label={ __( 'Show Purchase Button', 'jetpack' ) }
							checked={ showPurchaseButton }
							onChange={ () => setAttributes( { showPurchaseButton: ! showPurchaseButton } ) }
						/>
					</PanelBody>
					<PanelColorSettings
						title={ __( 'Color Settings', 'jetpack' ) }
						colorSettings={ [
							{
								value: backgroundColor,
								onChange: newBackgroundColor =>
									setAttributes( { backgroundColor: newBackgroundColor } ),
								label: __( 'Background Color', 'jetpack' ),
							},
							{
								value: textColor,
								onChange: newTextColor => setAttributes( { textColor: newTextColor } ),
								label: __( 'Text Color', 'jetpack' ),
							},
							{
								value: buttonAndLinkColor,
								onChange: newButtonAndLinkColor =>
									setAttributes( { buttonAndLinkColor: newButtonAndLinkColor } ),
								label: __( 'Button & Link Color', 'jetpack' ),
							},
						] }
					>
						{
							<ContrastChecker
								{ ...{
									isLargeText: false,
									textColor: textColor,
									backgroundColor: backgroundColor,
								} }
							/>
						}
					</PanelColorSettings>
				</>
			) }
		</InspectorControls>
	);

	const blockPreview = () => {
		const {
			title,
			detailPageUrl,
			listPrice,
			imageUrlMedium,
			imageWidthMedium,
			imageHeightMedium,
		} = data.products.filter( productDataItem => productDataItem.asin === asin )[ 0 ];

		// TODO - we should be able to get this from API in a neater way once we have access
		const seller = 'TODO';

		// TODO - we have different image sizes in the API
		const image = imageUrlMedium && (
			<a target="_blank" href={ detailPageUrl } rel="noopener noreferrer">
				<img
					alt={ title }
					src={ imageUrlMedium }
					width={ imageWidthMedium }
					heigth={ imageHeightMedium }
				/>
			</a>
		);

		const buttonTextColor = tinycolor
			.mostReadable( buttonAndLinkColor, [ '#ffffff' ], {
				includeFallbackColors: true,
				size: 'small',
			} )
			.toHexString();

		if ( ! asin ) {
			return null;
		}

		return (
			<div
				style={ { backgroundColor: backgroundColor, color: textColor, width: imageWidthMedium } }
			>
				{ showImage && image }
				{ showTitle && (
					<div className={ `${ defaultClassName }-title` }>
						<ExternalLink href={ detailPageUrl } style={ { color: buttonAndLinkColor } }>
							{ title }
						</ExternalLink>
					</div>
				) }
				{ showSeller && seller && (
					<div className={ `${ defaultClassName }-seller` }>
						{ seller.length > 0 && typeof seller !== 'string'
							? seller.map( singleSeller => singleSeller )
							: seller }
					</div>
				) }
				{ showPrice && <div className={ `${ defaultClassName }-list-price` }>{ listPrice }</div> }
				{ showPurchaseButton && (
					<Button
						href={ detailPageUrl }
						icon={ icon }
						variant="primary"
						className={ `${ defaultClassName }-button` }
						style={ {
							color: buttonTextColor,
							backgroundColor: buttonAndLinkColor,
							borderColor: buttonAndLinkColor,
						} }
					>
						{ __( 'Shop Now', 'jetpack' ) }
					</Button>
				) }
			</div>
		);
	};

	return (
		<div className={ className }>
			{ inspectorControls }
			{ asin ? blockPreview() : blockPlaceholder }
		</div>
	);
}

export default withNotices( AmazonEdit );
