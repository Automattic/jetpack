import { Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

/**
 * MediaBrowserSelectButton component
 *
 * @param {object}   props           - The component props
 * @param {string}   props.label     - The label of the button
 * @param {boolean}  props.isLoading - Whether the button is loading
 * @param {boolean}  props.disabled  - Whether the button is disabled
 * @param {Function} props.onClick   - To handle the click
 * @return {import('react').ReactElement} - JSX element
 */
const MediaBrowserSelectButton = ( { label, isLoading, disabled, onClick } ) => {
	return (
		<Stack
			align="center"
			justify="flex-end"
			className="jetpack-external-media-browser__media__toolbar"
		>
			<Button variant="primary" isBusy={ isLoading } disabled={ disabled } onClick={ onClick }>
				{ label }
			</Button>
		</Stack>
	);
};

export default MediaBrowserSelectButton;
