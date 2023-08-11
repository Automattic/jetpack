import { BlockControls } from '@wordpress/block-editor';
import { SandBox, withNotices } from '@wordpress/components';
import { useState, useEffect, useCallback } from '@wordpress/element';
import EditUrlForm from './components/edit-url-form';
import ErrorNotice from './components/error-notice';
import LoadingContainer from './components/loading-container';
import { PinterestBlockControls } from './controls';
import useTestPinterestEmbedUrl from './hooks/use-test-pinterest-embed-url';
import { pinType } from './utils';

export function PinterestEdit( {
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
	const getErrorNotice = useCallback( () => {
		return <ErrorNotice fallbackUrl={ editedUrl } onClick={ onReplace } />;
		// Disabling for onReplace and editedUrl as they are not requirements for creating a new function.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ hasTestUrlError ] );

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
		noticeOperations.removeAllNotices();
		// Set the input value of the edited URL.
		if ( pinterestUrl ) {
			setEditedUrl( pinterestUrl );
		}
		if ( hasTestUrlError ) {
			noticeOperations.createErrorNotice( getErrorNotice() );
		}
		// Disabling for noticeOperations as it is a prop and not a requirement for re-rendering.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ pinterestUrl, hasTestUrlError, setAttributes, getErrorNotice ] );

	if ( isFetching ) {
		return <LoadingContainer />;
	}

	const pinterestEmbedType = pinType( url );

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
			<BlockControls>
				<PinterestBlockControls setEditingState={ setIsEditing } />
			</BlockControls>
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
