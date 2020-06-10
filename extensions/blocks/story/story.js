/**
 * External dependencies
 */
import classnames from 'classnames';
import ResizeObserver from 'resize-observer-polyfill';
import { __ } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import { isBlobURL } from '@wordpress/blob';
import { isEqual } from 'lodash';
import { Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import createSwiper from './create-swiper';
import {
	swiperApplyAria,
	swiperInit,
	swiperPaginationRender,
	swiperResize,
} from './swiper-callbacks';

class Story extends Component {
	pendingRequestAnimationFrame = null;
	resizeObserver = null;

	constructor( props ) {
		super( props );

		this.storyRef = createRef();
		this.btnNextRef = createRef();
		this.btnPrevRef = createRef();
		this.paginationRef = createRef();
	}

	componentDidMount() {
		const { onError } = this.props;
		this.buildSwiper()
			.then( swiper => {
				this.swiperInstance = swiper;
				this.initializeResizeObserver( swiper );
			} )
			.catch( () => {
				onError( __( 'The Swiper library could not be loaded.', 'jetpack' ) );
			} );
	}

	componentWillUnmount() {
		this.clearResizeObserver();
		this.clearPendingRequestAnimationFrame();
	}

	componentDidUpdate( prevProps ) {
		const { align, mediaFiles, onError } = this.props;

		/* A change in alignment or mediaFiles only needs an update */
		if ( align !== prevProps.align || ! isEqual( mediaFiles, prevProps.mediaFiles ) ) {
			this.swiperInstance && this.swiperInstance.update();
		}
		if ( mediaFiles !== prevProps.mediaFiles ) {
			let realIndex;
			if ( ! this.swiperIndex ) {
				realIndex = 0;
			} else if ( mediaFiles.length === prevProps.mediaFiles.length ) {
				realIndex = this.swiperInstance.realIndex;
			} else {
				realIndex = prevProps.mediaFiles.length;
			}
			this.swiperInstance && this.swiperInstance.destroy( true, true );
			this.buildSwiper( realIndex )
				.then( swiper => {
					this.swiperInstance = swiper;
					this.initializeResizeObserver( swiper );
				} )
				.catch( () => {
					onError( __( 'The Swiper library could not be loaded.', 'jetpack' ) );
				} );
		}
	}

	initializeResizeObserver = swiper => {
		this.clearResizeObserver();
		this.resizeObserver = new ResizeObserver( () => {
			this.clearPendingRequestAnimationFrame();
			this.pendingRequestAnimationFrame = requestAnimationFrame( () => {
				swiperResize( swiper );
				swiper.update();
			} );
		} );
		this.resizeObserver.observe( swiper.el );
	};

	clearPendingRequestAnimationFrame = () => {
		if ( this.pendingRequestAnimationFrame ) {
			cancelAnimationFrame( this.pendingRequestAnimationFrame );
			this.pendingRequestAnimationFrame = null;
		}
	};

	clearResizeObserver = () => {
		if ( this.resizeObserver ) {
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}
	};

	render() {
		const { className, mediaFiles } = this.props;
		// Note: React omits the data attribute if the value is null, but NOT if it is false.
		// This is the reason for the unusual logic related to autoplay below.
		/* eslint-disable jsx-a11y/anchor-is-valid */
		return (
			<div className={ className } data-autoplay={ false } data-effect={ 'slide' }>
				<div className="wp-block-jetpack-story_container swiper-container" ref={ this.storyRef }>
					<div
						className="wp-block-jetpack-story_pagination swiper-pagination swiper-pagination-white"
						ref={ this.paginationRef }
					/>
					<a
						aria-label="Pause Story"
						className="wp-block-jetpack-story_button-pause"
						role="button"
					/>
					<ul className="wp-block-jetpack-story_swiper-wrapper swiper-wrapper">
						{ mediaFiles.map( ( { alt, caption, id, mime, type, url } ) => (
							<li
								className={ classnames(
									'wp-block-jetpack-story_slide',
									'swiper-slide',
									isBlobURL( url ) && 'is-transient'
								) }
								key={ id }
							>
								<figure>
									{ 'image' === type && (
										<img
											alt={ alt }
											className={
												`swiper-lazy wp-block-jetpack-story_image wp-image-${ id }` /* wp-image-${ id } makes WordPress add a srcset */
											}
											data-id={ id }
											src={ url }
										/>
									) }
									{ 'video' === type && (
										// eslint-disable-next-line jsx-a11y/media-has-caption
										<video
											title={ alt }
											type={ mime }
											className={
												`wp-block-jetpack-story_video wp-video-${ id }` /* wp-image-${ id } makes WordPress add a srcset */
											}
											data-id={ id }
											src={ url }
										/>
									) }
									{ isBlobURL( url ) && <Spinner /> }
								</figure>
							</li>
						) ) }
					</ul>
				</div>
			</div>
		);
		/* eslint-enable jsx-a11y/anchor-is-valid */
	}

	prefersReducedMotion = () => {
		return (
			typeof window !== 'undefined' &&
			window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches
		);
	};

	buildSwiper = ( initialSlide = 0 ) =>
		// Using refs instead of className-based selectors allows us to
		// have multiple swipers on one page without collisions, and
		// without needing to add IDs or the like.
		createSwiper(
			this.storyRef.current,
			{
				loop: true,
				initialSlide,
				navigation: {
					nextEl: this.btnNextRef.current,
					prevEl: this.btnPrevRef.current,
				},
				pagination: {
					clickable: true,
					el: this.paginationRef.current,
					type: 'bullets',
				},
			},
			{
				init: swiperInit,
				mediaFilesReady: swiperResize,
				paginationRender: swiperPaginationRender,
				transitionEnd: swiperApplyAria,
			}
		);
}

export default Story;
