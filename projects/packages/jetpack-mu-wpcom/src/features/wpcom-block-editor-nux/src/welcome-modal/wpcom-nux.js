import { Guide, GuidePage } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import blockPickerImage from '../../../../assets/images/block-picker.svg';
import editorImage from '../../../../assets/images/editor.svg';
import previewImage from '../../../../assets/images/preview.svg';
import privateImage from '../../../../assets/images/private.svg';
import { wpcomTrackEvent } from '../../../../common/tracks';

import './style.scss';

/**
 * The nux component.
 * @return {JSX.Element} The WpcomNux component or null.
 */
function WpcomNux() {
	const { show, isNewPageLayoutModalOpen, isManuallyOpened } = useSelect( select => ( {
		show: select( 'automattic/wpcom-welcome-guide' ).isWelcomeGuideShown(),
		isNewPageLayoutModalOpen:
			select( 'automattic/starter-page-layouts' ) && // Handle the case where SPT is not initalized.
			select( 'automattic/starter-page-layouts' ).isOpen(),
		isManuallyOpened: select( 'automattic/wpcom-welcome-guide' ).isWelcomeGuideManuallyOpened(),
	} ) );

	const { setShowWelcomeGuide } = useDispatch( 'automattic/wpcom-welcome-guide' );

	// Track opening of the welcome guide
	useEffect( () => {
		if ( show && ! isNewPageLayoutModalOpen ) {
			wpcomTrackEvent( 'calypso_editor_wpcom_nux_open', {
				is_gutenboarding: window.calypsoifyGutenberg?.isGutenboarding,
				is_manually_opened: isManuallyOpened,
			} );
		}
	}, [ isManuallyOpened, isNewPageLayoutModalOpen, show ] );

	if ( ! show || isNewPageLayoutModalOpen ) {
		return null;
	}

	const dismissWpcomNux = () => {
		wpcomTrackEvent( 'calypso_editor_wpcom_nux_dismiss', {
			is_gutenboarding: window.calypsoifyGutenberg?.isGutenboarding,
		} );
		setShowWelcomeGuide( false, { openedManually: false } );
	};

	const nuxPages = getWpcomNuxPages();

	return (
		<Guide
			className="wpcom-block-editor-nux"
			contentLabel={ __( 'Welcome to your website', 'jetpack-mu-wpcom' ) }
			finishButtonText={ __( 'Get started', 'jetpack-mu-wpcom' ) }
			onFinish={ dismissWpcomNux }
		>
			{ nuxPages.map( ( nuxPage, index ) => (
				<NuxPage
					key={ nuxPage.heading }
					pageNumber={ index + 1 }
					isLastPage={ index === nuxPages.length - 1 }
					{ ...nuxPage }
				/>
			) ) }
		</Guide>
	);
}

/**
 * This function returns a collection of NUX slide data
 * @return { Array } a collection of <NuxPage /> props
 */
function getWpcomNuxPages() {
	return [
		{
			heading: __( 'Welcome to your website', 'jetpack-mu-wpcom' ),
			description: __(
				'Edit your homepage, add the pages you need, and change your site’s look and feel.',
				'jetpack-mu-wpcom'
			),
			imgSrc: editorImage,
			alignBottom: true,
		},
		{
			heading: __( 'Add or edit your content', 'jetpack-mu-wpcom' ),
			description: __(
				'Edit the placeholder content we’ve started you off with, or click the plus sign to add more content.',
				'jetpack-mu-wpcom'
			),
			imgSrc: blockPickerImage,
		},
		{
			heading: __( 'Preview your site as you go', 'jetpack-mu-wpcom' ),
			description: __(
				'As you edit your site content, click “Preview” to see your site the way your visitors will.',
				'jetpack-mu-wpcom'
			),
			imgSrc: previewImage,
			alignBottom: true,
		},
		{
			heading: __( 'Hidden until you’re ready', 'jetpack-mu-wpcom' ),
			description: __(
				'Your site will remain hidden until launched. Click “Launch” in the toolbar to share it with the world.',
				'jetpack-mu-wpcom'
			),
			imgSrc: privateImage,
			alignBottom: true,
		},
	];
}

/**
 * Display the Nux page
 *
 * @param {object}  props                     - The props of the component.
 * @param {number}  props.pageNumber          - The number of page.
 * @param {boolean} props.isLastPage          - Whether the current page is the last one.
 * @param {boolean} [props.alignBottom=false] - Whether to align bottom.
 * @param {string}  props.heading             - The text of heading.
 * @param {string}  props.description         - The text of description.
 * @param {string}  props.imgSrc              - The src of image.
 * @return {JSX.Element} The NuxPage component.
 */
function NuxPage( { pageNumber, isLastPage, alignBottom = false, heading, description, imgSrc } ) {
	useEffect( () => {
		wpcomTrackEvent( 'calypso_editor_wpcom_nux_slide_view', {
			slide_number: pageNumber,
			is_last_slide: isLastPage,
			is_gutenboarding: window.calypsoifyGutenberg?.isGutenboarding,
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
	return (
		<GuidePage className="wpcom-block-editor-nux__page">
			<div className="wpcom-block-editor-nux__text">
				<h1 className="wpcom-block-editor-nux__heading">{ heading }</h1>
				<div className="wpcom-block-editor-nux__description">{ description }</div>
			</div>
			<div className="wpcom-block-editor-nux__visual">
				<img
					// Force remount so the stale image doesn't remain while new image is fetched
					key={ imgSrc }
					src={ imgSrc }
					alt=""
					aria-hidden="true"
					className={ 'wpcom-block-editor-nux__image' + ( alignBottom ? ' align-bottom' : '' ) }
				/>
			</div>
		</GuidePage>
	);
}

export default WpcomNux;
