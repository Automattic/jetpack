import { HashRouter, Routes, Route } from 'react-router-dom';
import WelcomeBanner from '../index.jsx';

export default {
	title: 'Packages/My Jetpack/Welcome Banner',
	component: WelcomeBanner,
};

const Template = args => (
	<HashRouter>
		<Routes>
			<Route path="/" element={ <WelcomeBanner { ...args } /> } />
		</Routes>
	</HashRouter>
);

export const Default = Template.bind( {} );
Default.parameters = {};
