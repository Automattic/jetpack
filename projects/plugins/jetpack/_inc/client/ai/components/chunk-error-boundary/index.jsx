import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';

/**
 * Keeps a failed lazy chunk load from unmounting the whole page.
 */
export default class ChunkErrorBoundary extends Component {
	state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	render() {
		if ( this.state.hasError ) {
			return (
				<Notice.Root intent="error">
					<Notice.Description>
						{ __( 'This tab could not be loaded. Reload the page to try again.', 'jetpack' ) }
					</Notice.Description>
				</Notice.Root>
			);
		}
		return this.props.children;
	}
}
