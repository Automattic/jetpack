/**
 * External dependencies
 */
import { ThemeProvider } from '@automattic/jetpack-components';
import * as WPElement from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';
import { HashRouter, Switch, Route, useLocation } from 'react-router-dom';
/**
 * Internal dependencies
 */
import { initStore } from '../state';
import AdminPage from './components/admin-page';
import EditVideoDetails from './components/edit-video-details';
import useUnloadPrevent from './hooks/use-unload-prevent';
import useVideos from './hooks/use-videos';
import './style.module.scss';

initStore();

/**
 * Component to scroll window to top on route change.
 *
 * @returns {null} Null.
 */
function ScrollToTop() {
	const location = useLocation();
	useEffect( () => {
		// Timeout to mitigate flickering.
		setTimeout( () => {
			window.scrollTo( 0, 0 );
		}, 0 );
	}, [ location ] );

	return null;
}

const VideoPress = () => {
	const { isUploading } = useVideos();

	useUnloadPrevent( {
		shouldPrevent: isUploading,
		message: __(
			'Leaving will cancel the upload. Are you sure you want to exit?',
			'jetpack-videopress-pkg'
		),
	} );

	return (
		<ThemeProvider>
			<HashRouter>
				<ScrollToTop />
				<Switch>
					<Route exact path="/">
						<AdminPage />
					</Route>
					<Route path="/video/:videoId/edit">
						<EditVideoDetails />
					</Route>
				</Switch>
			</HashRouter>
		</ThemeProvider>
	);
};

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-videopress-root' );

	if ( null === container ) {
		return;
	}

	// @todo: Remove fallback when we drop support for WP 6.1
	if ( WPElement.createRoot ) {
		WPElement.createRoot( container ).render( <VideoPress /> );
	} else {
		WPElement.render( <VideoPress />, container );
	}
}

render();
