/**
 * External dependencies
 */
import { ThemeProvider } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';
import ReactDOM from 'react-dom';
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
	useEffect( () => window.scrollTo( 0, 0 ), [ location ] );

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

	ReactDOM.render( <VideoPress />, container );
}

render();
