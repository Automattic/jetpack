// External Dependencies
import React, { Component } from 'react';

// Internal Dependencies
import './style.css';

const REGEX =
	/^(?:https?:\/\/)?((?:video|video\.word)press\.com\/(?:v|embed)\/)?(?<guid>[a-zA-Z\d]{7,})(?:.*)?/;

class VideoPress extends Component {
	static slug = 'divi_videopress';

	render() {
		let guid = this.props.guid;
		if ( ! guid ) {
			return null;
		}

		const matches = guid.match( REGEX );
		if ( ! matches || ! matches[ 2 ] ) {
			return null;
		}

		guid = matches[ 2 ];

		const url =
			'https://videopress.com/embed/' +
			guid +
			'?autoPlay=0&permalink=0&loop=0&embedder=divi-builder';
		const iframeTitle = `VideoPress video ${ guid }`;

		return (
			<div className="vidi-videopress-wrapper">
				<iframe title={ iframeTitle } src={ url } width="100%" height="100%"></iframe>
				<script src="https://en.wordpress.com/wp-content/plugins/video/assets/js/next/videopress-iframe.js?m=1658739239"></script>
			</div>
		);
	}
}

export default VideoPress;
