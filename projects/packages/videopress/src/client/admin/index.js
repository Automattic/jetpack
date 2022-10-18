/**
 * External dependencies
 */
import { ThemeProvider } from '@automattic/jetpack-components';
import ReactDOM from 'react-dom';
import { HashRouter, Routes, Route } from 'react-router-dom';
/**
 * Internal dependencies
 */
import { initStore } from '../state';
import AdminPage from './components/admin-page';
import EditVideoDetails from './components/edit-video-details';
import useUploadUnloadCheck from './hooks/use-upload-unload-check';
import './style.module.scss';

initStore();

const VideoPress = () => {
	useUploadUnloadCheck();

	return (
		<ThemeProvider>
			<HashRouter>
				<Routes>
					<Route path="/" element={ <AdminPage /> } />
					<Route path="video">
						<Route path=":videoId/edit" element={ <EditVideoDetails /> } />
					</Route>
				</Routes>
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
