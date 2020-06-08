/**
 * External dependencies
 */
import { uniqBy } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { createHigherOrderComponent } from '@wordpress/compose';
import { Component } from '@wordpress/element';
import { withNotices, Modal } from '@wordpress/components';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PATH_RECENT } from '../constants';
import MediaItem from '../media-browser/media-item';

const CopyingMedia = ( { items } ) => {
	const classname =
		items.length === 1
			? 'jetpack-external-media-browser__single'
			: 'jetpack-external-media-browser';

	return (
		<div className={ classname }>
			<div className="jetpack-external-media-browser__media">
				{ items.map( item => (
					<MediaItem item={ item } key={ item.ID } isSelected isCopying />
				) ) }
			</div>
		</div>
	);
};

export default function withMedia() {
	return createHigherOrderComponent( OriginalComponent => {
		// Grandfathered class as it was ported from an older codebase.
		class WithMediaComponent extends Component {
			constructor( props ) {
				super( props );

				this.state = {
					media: [],
					nextHandle: false,
					isLoading: false,
					isCopying: null,
					isAuthenticated: true,
					path: { ID: PATH_RECENT },
				};
			}

			setAuthenticated = isAuthenticated => this.setState( { isAuthenticated } );

			mergeMedia( initial, media ) {
				return uniqBy( initial.concat( media ), 'ID' );
			}

			getRequestUrl( base ) {
				const { nextHandle } = this.state;

				if ( nextHandle ) {
					return base + '&page_handle=' + encodeURIComponent( nextHandle );
				}

				return base;
			}

			getMedia = ( url, resetMedia = false ) => {
				if ( this.state.isLoading ) {
					return;
				}

				if ( resetMedia ) {
					this.props.noticeOperations.removeAllNotices();
				}

				this.setState(
					{
						isLoading: true,
						media: resetMedia ? [] : this.state.media,
						nextHandle: resetMedia ? false : this.state.nextHandle,
					},
					() => this.getMediaRequest( url )
				);
			};

			handleApiError = error => {
				if ( error.code === 'authorization_required' ) {
					this.setState( { isAuthenticated: false, isLoading: false, isCopying: false } );
					return;
				}

				const { noticeOperations } = this.props;

				noticeOperations.createErrorNotice(
					error.code === 'internal_server_error' ? 'Internal server error' : error.message
				);

				this.setState( { isLoading: false, isCopying: false } );
			};

			getMediaRequest = url => {
				const { nextHandle, media } = this.state;

				if ( nextHandle === false && media.length > 0 ) {
					/**
					 * Tried to make a request with no nextHandle. This can happen because
					 * InfiniteScroll sometimes triggers a request when the number of
					 * items is less than the scroll area. It should really be fixed
					 * there, but until that time...
					 */
					this.setState( {
						isLoading: false,
					} );

					return;
				}

				const path = this.getRequestUrl( url );
				const method = 'GET';

				this.setAuthenticated( true );

				apiFetch( {
					path,
					method,
					parse: window.wpcomFetch === undefined,
				} )
					.then( result => {
						this.setState( {
							media: this.mergeMedia( media, result.media ),
							nextHandle: result.meta.next_page,
							isLoading: false,
						} );
					} )
					.catch( this.handleApiError );
			};

			copyMedia = ( items, apiUrl ) => {
				this.setState( { isCopying: items } );
				this.props.noticeOperations.removeAllNotices();

				apiFetch( {
					path: apiUrl,
					method: 'POST',
					data: {
						media: items.map( item => ( {
							guid: item.guid,
							caption: item.caption,
							title: item.title,
						} ) ),
					},
				} )
					.then( result => {
						const { value, addToGallery, multiple } = this.props;
						const media = multiple ? result : result[ 0 ];

						this.props.onClose();

						// Select the image(s). This will close the modal
						this.props.onSelect( addToGallery ? value.concat( result ) : media );
					} )
					.catch( this.handleApiError );
			};

			onChangePath = ( path, cb ) => {
				this.setState( { path }, cb );
			};

			stopPropagation( event ) {
				event.stopPropagation();
			}

			stopArrowKeysPropagation = event => {
				/**
				 * When the External Media modal is open, pressing any arrow key causes
				 * it to close immediately. This is happening because the keydown event
				 * propagates outside the modal, triggering a re-render and a blur event
				 * eventually. We could avoid that by isolating the modal from the Image
				 * block render scope, but it is not possible in current implementation.
				 *
				 * This handler makes sure that the keydown event doesn't propagate further,
				 * which fixes the issue described above while still keeping arrow keys
				 * functional inside the modal.
				 */
				if ( [ UP, DOWN, LEFT, RIGHT ].includes( event.keyCode ) ) {
					event.stopPropagation();
				}
			};

			renderContent() {
				const { media, isLoading, nextHandle, isAuthenticated, path } = this.state;
				const { noticeUI, allowedTypes, multiple = false } = this.props;

				return (
					// eslint-disable-next-line jsx-a11y/no-static-element-interactions
					<div onMouseDown={ this.stopPropagation } onKeyDown={ this.stopArrowKeysPropagation }>
						{ noticeUI }

						<OriginalComponent
							getMedia={ this.getMedia }
							copyMedia={ this.copyMedia }
							isLoading={ isLoading }
							media={ media }
							pageHandle={ nextHandle }
							allowedTypes={ allowedTypes }
							isAuthenticated={ isAuthenticated }
							setAuthenticated={ this.setAuthenticated }
							multiple={ multiple }
							path={ path }
							onChangePath={ this.onChangePath }
						/>
					</div>
				);
			}

			render() {
				const { isCopying } = this.state;
				const { onClose } = this.props;

				const classes = classnames( {
					'jetpack-external-media-browser': true,
					'jetpack-external-media-browser__is-copying': isCopying,
				} );

				return (
					<Modal
						onRequestClose={ onClose }
						title={ isCopying ? __( 'Copying Media', 'jetpack' ) : __( 'Select Media', 'jetpack' ) }
						className={ classes }
					>
						{ isCopying ? <CopyingMedia items={ isCopying } /> : this.renderContent() }
					</Modal>
				);
			}
		}

		return withNotices( WithMediaComponent );
	} );
}
