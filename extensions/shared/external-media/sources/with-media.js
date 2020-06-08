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
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';

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

				// Announce the action with appended string of all the images' alt text.
				speak(
					sprintf(
						__( 'Inserting: %s', 'jetpack' ),
						items
							.map( item => item.title )
							.filter( item => item )
							.join( ', ' )
					),
					'polite'
				);

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

			render() {
				const { isAuthenticated, isCopying, isLoading, media, nextHandle, path } = this.state;
				const { allowedTypes, multiple = false, noticeUI, onClose } = this.props;

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
						{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */ }
						<div onMouseDown={ this.stopPropagation }>
							{ noticeUI }

							<OriginalComponent
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

		return withNotices( WithMediaComponent );
	} );
}
