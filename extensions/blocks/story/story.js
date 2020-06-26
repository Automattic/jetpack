/**
 * External dependencies
 */
import classNames from 'classnames';
import { Component, createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import player from './player';

const storyPlayerSettings = {
	slides: [],
	shadowDOM: { enabled: false },
	playInFullScreen: false,
	tapToPlayPause: true,
};

class Story extends Component {
	constructor( props ) {
		super( props );

		this.storyRef = createRef();
	}

	componentDidMount() {
		this.buildStoryPlayer();
	}

	componentDidUpdate( prevProps ) {
		const { mediaFiles, onError } = this.props;

		if ( mediaFiles !== prevProps.mediaFiles ) {
			this.buildStoryPlayer( this.storyRef.current, {
				...storyPlayerSettings,
				slides: mediaFiles,
			} );
		}
	}

	render() {
		const { className } = this.props;

		return <div className={ classNames( [ `wp-story`, className ] ) } ref={ this.storyRef }></div>;
	}

	buildStoryPlayer = ( initialSlide = 0 ) => {
		const { mediaFiles } = this.props;
		player( this.storyRef.current, {
			...storyPlayerSettings,
			slides: mediaFiles,
		} );
	};

	prefersReducedMotion = () => {
		return (
			typeof window !== 'undefined' &&
			window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches
		);
	};
}

export default Story;
