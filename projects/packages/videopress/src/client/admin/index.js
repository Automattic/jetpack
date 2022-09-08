import { ThemeProvider } from '@automattic/jetpack-components';
import ReactDOM from 'react-dom';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { initStore } from '../state';
import AdminPage from './components/admin-page';

initStore();

const VideoPress = () => (
	<ThemeProvider>
		<HashRouter>
			<Routes>
				<Route path="/" element={ <AdminPage /> } />
			</Routes>
		</HashRouter>
	</ThemeProvider>
);

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
