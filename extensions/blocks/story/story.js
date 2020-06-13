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
import './style.scss';
import player from './player';

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
		}
	}

	initializeResizeObserver = swiper => {
		this.clearResizeObserver();
		this.resizeObserver = new ResizeObserver( () => {
			this.clearPendingRequestAnimationFrame();
			this.pendingRequestAnimationFrame = requestAnimationFrame( () => {
				//swiperResize( swiper );
				//swiper.update();
			} );
		} );
		//this.resizeObserver.observe( swiper.el );
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
				<div className="wp-block-jetpack-story_container wp-story-container" ref={ this.storyRef }>
					<div
						className="wp-block-jetpack-story_pagination wp-story-pagination"
						ref={ this.paginationRef }
					/>
					<a
						aria-label="Play Story"
						className="wp-block-jetpack-story_button-play-pause wp-story-button-play-pause"
						role="button"
					/>
					<ul className="wp-block-jetpack-story_wrapper wp-story-wrapper">
						{ mediaFiles.map( ( { alt, caption, id, mime, type, url } ) => (
							<li
								className={ classnames(
									'wp-block-jetpack-story_slide wp-story-slide',
									isBlobURL( url ) && 'is-transient'
								) }
								key={ id }
							>
								<figure>
									{ 'image' === type && (
										<img
											alt={ alt }
											className={
												`wp-block-jetpack-story_image wp-image-${ id }` /* wp-image-${ id } makes WordPress add a srcset */
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
												`wp-block-jetpack-story_video intrinsic-ignore wp-video-${ id }` /* wp-image-${ id } makes WordPress add a srcset */
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
}

export default Story;
