import { Button, Spinner, Composite } from '@wordpress/components';
import { useCallback, useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import React from 'react';
import MediaItem from './media-item';
import './style.scss';

const MAX_SELECTED = 10;

/**
 * MediaBrowser component
 *
 * @param {object}   props                  - The component props
 * @param {object[]} props.media            - The list of media
 * @param {boolean}  props.isCopying        - Whether the media browser is copying the media
 * @param {boolean}  props.isLoading        - Whether the media browser is loading
 * @param {boolean}  props.imageOnly        - Whether to skip non-media items
 * @param {number}   props.pageHandle       - The current page
 * @param {string}   props.className        - The class name
 * @param {boolean}  props.multiple         - Whether to allow multiple selection
 * @param {Function} props.setPath          - To set the path for the folder item
 * @param {Function} props.nextPage         - To get the next path
 * @param {Function} props.onCopy           - To handle the copy
 * @param {string}   props.selectButtonText - The text of the selection button
 * @param {boolean}  props.shouldProxyImg   - Whether to use the proxy for the media URL
 * @return {React.ReactElement} - JSX element
 */
function MediaBrowser( {
	media,
	isCopying,
	isLoading,
	imageOnly,
	pageHandle,
	className,
	multiple,
	setPath,
	nextPage,
	onCopy,
	selectButtonText,
	shouldProxyImg,
} ) {
	const [ selected, setSelected ] = useState( [] );
	const gridEl = useRef( null );

	const select = useCallback(
		newlySelected => {
			let newSelected = [ newlySelected ];

			if ( newlySelected.type === 'folder' ) {
				setPath( newlySelected.ID );
			} else if ( multiple ) {
				newSelected = selected.slice( 0, MAX_SELECTED - 1 ).concat( newlySelected );

				if ( selected.find( item => newlySelected.ID === item.ID ) ) {
					newSelected = selected.filter( item => item.ID !== newlySelected.ID );
				}
			} else if ( selected.length === 1 && newlySelected.ID === selected[ 0 ].ID ) {
				newSelected = [];
			}

			setSelected( newSelected );
		},
		[ selected, multiple, setPath ]
	);

	const onCopyAndInsert = useCallback( () => {
		onCopy( selected );
	}, [ selected, onCopy ] );

	const hasMediaItems = media.filter( item => item.type !== 'folder' ).length > 0;
	const classes = clsx( {
		'jetpack-external-media-browser__media': true,
		'jetpack-external-media-browser__media__loading': isLoading,
	} );
	const wrapper = clsx( {
		'jetpack-external-media-browser': true,
		[ className ]: true,
	} );

	// Using _event to avoid eslint errors. Can change to event if it's in use again.
	const handleMediaItemClick = ( _event, { item } ) => {
		select( item );
	};

	const SelectButton = selectProps => {
		const disabled = selected.length === 0 || isCopying;
		const defaultLabel = isCopying
			? __( 'Inserting…', 'jetpack-external-media' )
			: __( 'Select', 'jetpack-external-media', /* dummy arg to avoid bad minification */ 0 );
		const label = selectProps?.labelText
			? selectProps?.labelText( selected.length, isCopying )
			: defaultLabel;

		return (
			<div className="jetpack-external-media-browser__media__toolbar">
				<Button
					variant="primary"
					isBusy={ isCopying }
					disabled={ disabled }
					onClick={ onCopyAndInsert }
				>
					{ label }
				</Button>
			</div>
		);
	};

	// Infinite scroll
	useEffect( () => {
		const target = gridEl.current?.lastElementChild;
		let observer;
		if ( pageHandle && ! isLoading && target ) {
			observer = new window.IntersectionObserver( entries => {
				if ( entries[ 0 ].isIntersecting ) {
					nextPage();
				}
			} );

			observer.observe( target );
		}

		return () => {
			observer?.unobserve( target );
		};
	}, [ pageHandle, isLoading, gridEl ] ); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className={ wrapper }>
			<Composite
				role="listbox"
				ref={ gridEl }
				className={ classes }
				aria-label={ __( 'Media list', 'jetpack-external-media' ) }
				render={ <ul /> }
			>
				{ media.map( item => (
					<MediaItem
						item={ item }
						imageOnly={ imageOnly }
						key={ item.ID }
						onClick={ handleMediaItemClick }
						isSelected={ selected.find( toFind => toFind.ID === item.ID ) }
						isCopying={ isCopying }
						shouldProxyImg={ shouldProxyImg }
					/>
				) ) }
			</Composite>

			{ media.length === 0 && ! isLoading && (
				<div className="jetpack-external-media-browser__empty">
					<p>
						{ __( 'Sorry, but nothing matched your search criteria.', 'jetpack-external-media' ) }
					</p>
				</div>
			) }

			{ isLoading && (
				<div className="jetpack-external-media-browser__loading">
					<Spinner />
				</div>
			) }

			{ hasMediaItems && <SelectButton labelText={ selectButtonText } /> }
		</div>
	);
}

export default MediaBrowser;
