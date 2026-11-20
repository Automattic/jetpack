import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import StaticWarning from 'components/jetpack-notices/static-warning';
import store from 'state/redux-store';

const noscriptNotice = renderToStaticMarkup(
	<Provider store={ store }>
		<noscript>
			<StaticWarning />
		</noscript>
	</Provider>
);

const versionNotice = renderToStaticMarkup(
	<Provider store={ store }>
		<StaticWarning />
	</Provider>
);

export default () => ( {
	'static-noscript-notice.html': noscriptNotice,
	'static-version-notice.html': versionNotice,
} );
