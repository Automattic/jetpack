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
import { __ } from '@wordpress/i18n';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { PATH_RECENT } from '../constants';

export default function withMedia() {
	return createHigherOrderComponent( OriginalComponent => {
		// Legacy class as it was ported from an older codebase.
		class WithMediaComponent extends Component {
			constructor( props ) {
				super( props );

				this.defaultAccount = {
					image: '',
					name: '',
				};

				this.state = {
					account: this.defaultAccount,
					media: [],
					nextHandle: false,
					isLoading: false,
					isCopying: null,
					isAuthenticated: true,
					path: { ID: PATH_RECENT },
				};
			}

			contentRef = el => {
				if ( el ) {
					// Store modal content.
					this.contentElement = el;
					// Find the modal wrapper.
					this.modalElement = el.closest( '.jetpack-external-media-browser' );

					// Attach the listener if found.
					if ( this.modalElement ) {
						this.modalElement.addEventListener( 'keydown', this.stopArrowKeysPropagation );
					}
				} else if ( this.modalElement ) {
					// Remove listeners when unmounting.
					this.modalElement.removeEventListener( 'keydown', this.stopArrowKeysPropagation );
					this.modalElement = null;
					this.contentElement = null;
				}
			};

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
				 *
				 * This can be removed once
				 * https://github.com/WordPress/gutenberg/issues/22940 is fixed.
				 */
				if (
					[ UP, DOWN, LEFT, RIGHT ].includes( event.keyCode ) &&
					! event.target.classList.contains( 'jetpack-external-media-browser__media__item' ) // Only let arrow key navigation on media grid items through. All others need to be stopped.
				) {
					event.stopPropagation();
				}
			};

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
						account: resetMedia ? this.defaultAccount : this.state.account,
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

				// Normalize upload errors.
				if ( error.errors?.length ) {
					error = {
						code: error.errors[ 0 ].error,
						message: error.errors[ 0 ].message,
					};
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
							account: result.meta.account,
							media: this.mergeMedia( media, result.media ),
							nextHandle: result.meta.next_page,
							isLoading: false,
						} );
					} )
					.catch( this.handleApiError );
			};

			copyMedia = ( items, apiUrl, source ) => {
				this.setState( { isCopying: items } );
				this.props.noticeOperations.removeAllNotices();

				// If we have a modal element set, focus it.
				// Otherwise focus is reset to the body instead of staying within the Modal.
				if ( this.modalElement ) {
					this.modalElement.focus();
				}

				apiFetch( {
					path: apiUrl,
					method: 'POST',
					data: {
						external_ids: items.map( item => item.guid ), // WPCOM.
						media: items.map( item => ( {
							guid: item.guid,
							caption: item.caption,
							title: item.title,
						} ) ),
						service: source, // WPCOM.
						post_id: this.props.postId ?? 0,
					},
				} )
					.then( result => {
						// Convert response on Simple Sites.
						if ( result.media ) {
							result = result.media.map( image => ( {
								alt: image.alt,
								caption: image.caption,
								id: image.ID,
								type: 'image',
								url: image.URL,
							} ) );
						}

						const { value, addToGallery, multiple } = this.props;
						const media = multiple ? result : result[ 0 ];

						const itemWithErrors = result.find( item => item.errors );
						if ( itemWithErrors ) {
							const { errors } = itemWithErrors;
							const firstErrorKey = Object.keys( errors )[ 0 ];
							this.handleApiError( {
								code: firstErrorKey,
								message: errors[ firstErrorKey ],
							} );
							return;
						}

						this.props.onClose();

						// Select the image(s). This will close the modal
						this.props.onSelect( addToGallery ? value.concat( result ) : media );
					} )
					.catch( this.handleApiError );
			};

			onChangePath = ( path, cb ) => {
				this.setState( { path }, cb );
			};

			render() {
				const {
					account,
					isAuthenticated,
					isCopying,
					isLoading,
					media,
					nextHandle,
					path,
				} = this.state;
				const { allowedTypes, multiple = false, noticeUI, onClose } = this.props;

				const title = isCopying
					? __( 'Inserting media', 'jetpack' )
					: __( 'Select media', 'jetpack' );
				const description = isCopying
					? __(
							'When the media is finished copying and inserting, you will be returned to the editor.',
							'jetpack'
					  )
					: __( 'Select the media you would like to insert into the editor.', 'jetpack' );

				const describedby = 'jetpack-external-media-browser__description';
				const classes = classnames( {
					'jetpack-external-media-browser': true,
					'jetpack-external-media-browser--is-copying': isCopying,
				} );

				return (
					<Modal
						onRequestClose={ onClose }
						title={ title }
						aria={ { describedby } }
						className={ classes }
					>
						<div ref={ this.contentRef }>
							{ noticeUI }

							<p id={ describedby } className="jetpack-external-media-browser--visually-hidden">
								{ description }
							</p>

							<OriginalComponent
								account={ account }
								getMedia={ this.getMedia }
								copyMedia={ this.copyMedia }
								isCopying={ isCopying }
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
					</Modal>
				);
			}
		}

		return withSelect( select => {
			return {
				postId: select( 'core/editor' ).getCurrentPostId(),
			};
		} )( withNotices( WithMediaComponent ) );
	} );
}
