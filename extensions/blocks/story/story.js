/**
 * External dependencies
 */
import classnames from 'classnames';
import ResizeObserver from 'resize-observer-polyfill';
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
		return null;
	}

	prefersReducedMotion = () => {
		return (
			typeof window !== 'undefined' &&
			window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches
		);
	};
}

export default Story;
