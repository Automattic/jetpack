/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { SandBox, Button, withNotices } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { fallback, pinType } from './utils';
import PinterestControls from './controls';
import LoadingContainer from './components/loading-container';
import EditUrlForm from './components/edit-url-form';
import useTestPinterestEmbedUrl from './hooks/use-test-pinterest-embed-url';

function PinterestEdit( {
	attributes,
	isSelected,
	className,
	noticeOperations,
	noticeUI,
	setAttributes,
	onReplace,
} ) {
	const { url } = attributes;
	const { isFetching, pinterestUrl, testUrl, hasTestUrlError } = useTestPinterestEmbedUrl();
	const [ isInteractive, setIsInteractive ] = useState( false );
	const [ editedUrl, setEditedUrl ] = useState( '' );
	const [ isEditing, setIsEditing ] = useState( false );

	/**
	 * Sets an error notice using noticeOperations.
	 */
	const setErrorNotice = () => {
		noticeOperations.createErrorNotice(
			<>
				{ __( 'Sorry, this content could not be embedded.', 'jetpack' ) }{ ' ' }
				<Button isLink onClick={ () => fallback( editedUrl, onReplace ) }>
					{ _x( 'Convert block to link', 'button label', 'jetpack' ) }
				</Button>
			</>
		);
	};

	/**
	 * Wrapper for noticeOperations.removeAllNotices.
	 */
	const removeAllNotices = () => noticeOperations.removeAllNotices();

	/**
	 * Submit handler for the url editing form.
	 */
	const onSubmitForm = () => {
		if ( isFetching ) {
			return;
		}
		testUrl( editedUrl );
		setIsEditing( false );
	};

	/**
	 * This is called onMouseUp on the overlay. We can't respond to the `isSelected` prop
	 * changing, because that happens on mouse down, and the overlay immediately disappears,
	 * and the mouse event can end up in the preview content. We can't use onClick on
	 * the overlay to hide it either, because then the editor misses the mouseup event, and
	 * thinks we're multi-selecting blocks.
	 */
	const hideOverlay = () => {
		setIsInteractive( true );
	};

	/*
		Set the URL when the component mounts.
		We disable missing dependencies warning in the linter
		because we want this to run once on mount.
	 */
	useEffect( () => {
		if ( url ) {
			testUrl( url );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	/*
		We only want to change `isInteractive` when the block is not selected, because changing it when
		the block becomes selected makes the overlap disappear too early. Hiding the overlay
		happens on mouseup when the overlay is clicked.
	*/
	useEffect( () => {
		if ( ! isSelected && isInteractive ) {
			setIsInteractive( false );
		}
	}, [ isSelected, isInteractive ] );

	// Listen out for changes to after we've tested the url via `testUrl()`.
	useEffect( () => {
		setAttributes( { url: pinterestUrl } );
		removeAllNotices();
		// Set the input value of the edited URL.
		if ( pinterestUrl ) {
			setEditedUrl( pinterestUrl );
		}
		if ( hasTestUrlError ) {
			setErrorNotice();
		}
		// Disabling for setErrorNotice and removeAllNotices for now until we can further refactor.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ pinterestUrl, hasTestUrlError, setAttributes, removeAllNotices ] );

	if ( isFetching ) {
		return <LoadingContainer />;
	}

	const pinterestEmbedType = pinType( url );
	// TODO: try to catch invalid pinterest URLs as well, e.g., https://www.pinterest.com.au/pin/this-is-the-furniture-every-pet-parent-needs--710161434992927062/.
	// They render nothing.

	if ( isEditing || ! url || ( url && ! pinterestEmbedType ) ) {
		return (
			<EditUrlForm
				className={ className }
				onSubmit={ onSubmitForm }
				noticeUI={ noticeUI }
				url={ editedUrl }
				setUrl={ setEditedUrl }
			/>
		);
	}

	const sandBoxHTML = `<a data-pin-do='${ pinterestEmbedType }' href='${ url }'></a>`;
	/*
		Disabled because the overlay div doesn't actually have a role or functionality
		as far as the user is concerned. We're just catching the first click so that
		the block can be selected without interacting with the embed preview that the overlay covers.
	 */
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<div className={ className }>
			<PinterestControls setEditingState={ setIsEditing } />
			<div>
				<SandBox
					html={ sandBoxHTML }
					scripts={ [ 'https://assets.pinterest.com/js/pinit.js' ] }
					onFocus={ hideOverlay }
				/>
				{ ! isInteractive && (
					<div className="block-library-embed__interactive-overlay" onMouseUp={ hideOverlay } />
				) }
			</div>
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}

export default withNotices( PinterestEdit );
