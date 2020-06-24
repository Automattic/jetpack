/**
 * Internal dependencies
 */
import { Bullet, Controls, Header, Overlay, Media } from './components';

export default {
	renderBullet: ( html, props ) =>
		html`
			<${Bullet} ...${props} />
		`,
	renderControls: ( html, props ) =>
		html`
			<${Controls} ...${props} />
		`,
	renderHeader: ( html, props ) =>
		html`
			<${Header} ...${props} />
		`,
	renderOverlay: ( html, props ) =>
		html`
			<${Overlay} ...${props} />
		`,
	renderMedia: ( html, props ) =>
		html`
			<${Media} ...${props} />
		`,
};
