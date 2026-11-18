/* eslint-disable react/jsx-no-bind */
/**
 * The images a payment button shows at checkout: up to five on the product, and one
 * per option of the group that carries the prices.
 *
 * Each image goes to PayPal when it is picked, so the list shows what PayPal took and
 * the post save only references it.
 *
 * @package
 */

import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, DropdownMenu, Icon, Spinner } from '@wordpress/components';
import { useCallback, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { image as imageIcon, lineSolid, moreVertical, plus } from '@wordpress/icons';
import { Field, Notice } from '@wordpress/ui';
import { releaseImage, useImageUpload } from '../hooks/use-image-upload';
import { MAX_PRODUCT_IMAGES, mediaName } from '../utils/images';

const helpProductImages = sprintf(
	/* translators: %d: maximum number of product images */
	__(
		'Add up to %d product images to your product checkout page. JPEG, PNG, BMP or TIFF. 12 MB per file.',
		'jetpack-paypal-payments'
	),
	MAX_PRODUCT_IMAGES
);
const helpInReview = __(
	'An image in review is hidden from buyers until PayPal approves it, usually within 24 hours.',
	'jetpack-paypal-payments'
);
const labelAddImages = __( 'Add images', 'jetpack-paypal-payments' );
const labelAddImage = __( 'Add image', 'jetpack-paypal-payments' );

/**
 * Whether an image is still in PayPal's review.
 *
 * @param {object} image - The image as the block stores it.
 * @return {boolean} True while IN_REVIEW.
 */
function isInReview( image ) {
	return 'IN_REVIEW' === image?.status;
}

/**
 * Opens the media modal, as a button.
 *
 * @param {object}   props          - Component props.
 * @param {Function} props.onSelect - Called with what was picked.
 * @param {boolean}  props.multiple - Whether more than one image can be picked.
 * @param {object}   props.button   - Props for the Button that opens the modal.
 * @return {Element} The button.
 */
function PickImages( { onSelect, multiple, button } ) {
	return (
		<MediaUploadCheck>
			<MediaUpload
				onSelect={ onSelect }
				allowedTypes={ [ 'image' ] }
				multiple={ multiple }
				render={ ( { open } ) => <Button { ...button } onClick={ open } /> }
			/>
		</MediaUploadCheck>
	);
}

/**
 * The messages for files PayPal or the pre-checks refused.
 *
 * @param {object}   props           - Component props.
 * @param {string[]} props.errors    - One message per file.
 * @param {Function} props.onDismiss - Clears them.
 * @return {Element|null} The notice, or nothing.
 */
function UploadErrors( { errors, onDismiss } ) {
	if ( ! errors.length ) {
		return null;
	}

	return (
		<Notice.Root intent="error" className="jetpack-paypal-images__errors">
			<Notice.Description>
				{ errors.map( ( message, index ) => (
					<span key={ message }>
						{ index > 0 && <br /> }
						{ message }
					</span>
				) ) }
			</Notice.Description>
			<Notice.CloseIconButton onClick={ onDismiss } />
		</Notice.Root>
	);
}

/**
 * One image in the list: its thumbnail, name and control, with a badge underneath.
 *
 * @param {object}   props         - Component props.
 * @param {object}   props.image   - The image as the block stores it.
 * @param {Element}  props.control - The remove button or the menu.
 * @param {string[]} props.badges  - Labels shown under the row.
 * @return {Element} The row.
 */
function ImageRow( { image, control, badges } ) {
	const src = image.thumbnailUrl || image.url;
	const name = image.name || __( 'Image', 'jetpack-paypal-payments' );

	return (
		<li className="jetpack-paypal-images__row">
			<div className="jetpack-paypal-images__item">
				{ src ? (
					<img className="jetpack-paypal-images__thumb" src={ src } alt="" />
				) : (
					<span className="jetpack-paypal-images__thumb jetpack-paypal-images__thumb--empty">
						<Icon icon={ imageIcon } />
					</span>
				) }
				<span className="jetpack-paypal-images__name" title={ name }>
					{ name }
				</span>
				{ control }
			</div>
			{ badges.length > 0 && (
				<div className="jetpack-paypal-images__badges">
					{ badges.map( badge => (
						<span key={ badge } className="jetpack-paypal-images__badge">
							{ badge }
						</span>
					) ) }
				</div>
			) }
		</li>
	);
}

/**
 * A file on its way to PayPal.
 *
 * @param {object} props       - Component props.
 * @param {object} props.media - The media library item being sent.
 * @return {Element} The row.
 */
function PendingRow( { media } ) {
	return (
		<li className="jetpack-paypal-images__row jetpack-paypal-images__row--pending">
			<div className="jetpack-paypal-images__item">
				<Spinner />
				<span className="jetpack-paypal-images__name">
					{ sprintf(
						/* translators: %s: file name */
						__( 'Uploading %s…', 'jetpack-paypal-payments' ),
						mediaName( media )
					) }
				</span>
			</div>
		</li>
	);
}

/**
 * The product's images. The first is the primary image PayPal leads with.
 *
 * @param {object}   props            - Component props.
 * @param {Array}    props.images     - The images attribute.
 * @param {Function} props.onChange   - Called with the next images attribute.
 * @param {boolean}  props.disabled   - Whether the controls are disabled.
 * @param {boolean}  props.hasPayment - Whether the block points at a saved payment, whose
 *                                    in-review images PayPal will not let go yet.
 * @return {Element} The field.
 */
export default function ProductImages( { images = [], onChange, disabled, hasPayment } ) {
	// The upload resolves after the merchant may have removed or reordered rows.
	const latest = useRef( images );
	latest.current = images;

	const onUploaded = useCallback(
		taken => onChange( [ ...latest.current, ...taken ] ),
		[ onChange ]
	);
	const { upload, pending, errors, clearErrors } = useImageUpload( onUploaded );

	const remaining = MAX_PRODUCT_IMAGES - images.length - pending.length;
	const canAdd = ! disabled && remaining > 0;

	const pick = selection => upload( selection, remaining );

	const remove = index => {
		releaseImage( images[ index ].assetId );
		onChange( images.filter( ( _, i ) => i !== index ) );
	};

	const makePrimary = index => {
		onChange( [ images[ index ], ...images.filter( ( _, i ) => i !== index ) ] );
	};

	const hasRows = images.length > 0 || pending.length > 0;

	return (
		<div className="jetpack-paypal-images">
			<div className="jetpack-paypal-images__header">
				<Field.VisualLabel>{ __( 'Image', 'jetpack-paypal-payments' ) }</Field.VisualLabel>
				{ hasRows && canAdd && (
					<PickImages
						onSelect={ pick }
						multiple={ remaining > 1 }
						button={ { icon: plus, label: labelAddImages, size: 'small' } }
					/>
				) }
			</div>

			<UploadErrors errors={ errors } onDismiss={ clearErrors } />

			{ hasRows && (
				<ul className="jetpack-paypal-images__list">
					{ images.map( ( image, index ) => {
						const name = image.name || __( 'Image', 'jetpack-paypal-payments' );
						const locked = hasPayment && isInReview( image );
						const badges = [
							...( index === 0 ? [ __( 'Primary', 'jetpack-paypal-payments' ) ] : [] ),
							...( isInReview( image ) ? [ __( 'In review', 'jetpack-paypal-payments' ) ] : [] ),
						];
						const control =
							index === 0 ? (
								<Button
									icon={ lineSolid }
									size="small"
									disabled={ disabled || locked }
									onClick={ () => remove( index ) }
									label={ sprintf(
										/* translators: %s: file name */
										__( 'Remove %s', 'jetpack-paypal-payments' ),
										name
									) }
								/>
							) : (
								<DropdownMenu
									icon={ moreVertical }
									label={ sprintf(
										/* translators: %s: file name */
										__( 'Options for %s', 'jetpack-paypal-payments' ),
										name
									) }
									toggleProps={ { size: 'small', disabled } }
									controls={ [
										{
											title: __( 'Make primary', 'jetpack-paypal-payments' ),
											onClick: () => makePrimary( index ),
										},
										{
											title: __( 'Remove', 'jetpack-paypal-payments' ),
											onClick: () => remove( index ),
											isDisabled: locked,
										},
									] }
								/>
							);

						return (
							<ImageRow
								key={ image.assetId || image.attachmentId || index }
								image={ image }
								control={ control }
								badges={ badges }
							/>
						);
					} ) }
					{ pending.map( media => (
						<PendingRow key={ media.id } media={ media } />
					) ) }
				</ul>
			) }

			{ ! hasRows && (
				<PickImages
					onSelect={ pick }
					multiple
					button={ {
						icon: imageIcon,
						variant: 'secondary',
						disabled: ! canAdd,
						className: 'jetpack-paypal-images__add',
						children: labelAddImages,
					} }
				/>
			) }

			<p className="jetpack-paypal-images__help">
				{ helpProductImages }
				{ images.some( isInReview ) && (
					<>
						<br />
						{ helpInReview }
					</>
				) }
			</p>
		</div>
	);
}

/**
 * The one image a variant option can carry.
 *
 * @param {object}      props             - Component props.
 * @param {object|null} props.image       - The option's image, if any.
 * @param {Function}    props.onChange    - Called with the next image, or null.
 * @param {boolean}     props.disabled    - Whether the controls are disabled.
 * @param {boolean}     props.hasPayment  - See ProductImages.
 * @param {string}      props.optionLabel - The option, for the controls' accessible names.
 * @return {Element} The field.
 */
export function OptionImage( { image, onChange, disabled, hasPayment, optionLabel } ) {
	const onUploaded = useCallback( ( [ taken ] ) => onChange( taken ), [ onChange ] );
	const { upload, pending, errors, clearErrors } = useImageUpload( onUploaded );

	const remove = () => {
		releaseImage( image.assetId );
		onChange( null );
	};

	const name = image?.name || __( 'Image', 'jetpack-paypal-payments' );
	const locked = hasPayment && isInReview( image );

	return (
		<div className="jetpack-paypal-images jetpack-paypal-images--option">
			<UploadErrors errors={ errors } onDismiss={ clearErrors } />

			{ image && (
				<ul className="jetpack-paypal-images__list">
					<ImageRow
						image={ image }
						badges={ isInReview( image ) ? [ __( 'In review', 'jetpack-paypal-payments' ) ] : [] }
						control={
							<Button
								icon={ lineSolid }
								size="small"
								disabled={ disabled || locked }
								onClick={ remove }
								label={ sprintf(
									/* translators: 1: file name, 2: option name */
									__( 'Remove %1$s from %2$s', 'jetpack-paypal-payments' ),
									name,
									optionLabel
								) }
							/>
						}
					/>
				</ul>
			) }

			{ ! image && pending.length > 0 && (
				<ul className="jetpack-paypal-images__list">
					<PendingRow media={ pending[ 0 ] } />
				</ul>
			) }

			{ ! image && pending.length === 0 && (
				<PickImages
					onSelect={ selection => upload( selection, 1 ) }
					multiple={ false }
					button={ {
						icon: imageIcon,
						variant: 'secondary',
						disabled,
						className: 'jetpack-paypal-images__add',
						children: labelAddImage,
						'aria-label': sprintf(
							/* translators: %s: option name */
							__( 'Add image to %s', 'jetpack-paypal-payments' ),
							optionLabel
						),
					} }
				/>
			) }
		</div>
	);
}
