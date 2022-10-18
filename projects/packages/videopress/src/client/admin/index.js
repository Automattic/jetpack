/**
 * External dependencies
 */
import { ThemeProvider } from '@automattic/jetpack-components';
import { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Switch, Route, useLocation } from 'react-router-dom';
/**
 * Internal dependencies
 */
import { initStore } from '../state';
import AdminPage from './components/admin-page';
import EditVideoDetails from './components/edit-video-details';
import useUploadUnloadCheck from './hooks/use-upload-unload-check';
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
	useUploadUnloadCheck();

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
