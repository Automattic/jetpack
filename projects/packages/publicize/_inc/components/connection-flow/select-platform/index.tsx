import { useDispatch } from '@wordpress/data';
import { store } from '../../../social-store';
import { PlatformGrid } from '../platform-grid';

/**
 * The platform picker step of the connection flow.
 *
 * Renders the platform grid as the body of the connection-flow modal's
 * `Dialog.Content` (the modal owns the header/close/back chrome). Selecting a
 * card advances the flow: services with custom inputs land on `platform-input`,
 * the rest go straight to `authorizing` (routing lives in the reducer).
 *
 * @return {import('react').ReactNode} The platform picker step.
 */
export function SelectPlatform() {
	const { selectPlatform } = useDispatch( store );

	return <PlatformGrid onSelect={ selectPlatform } />;
}
