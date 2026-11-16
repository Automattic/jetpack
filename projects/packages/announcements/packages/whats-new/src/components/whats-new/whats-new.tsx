/**
 * Internal dependencies
 */
import { useAnnouncements } from '../../hooks';

export type WhatsNewProps = {
	/*
	 * The channels the host subscribes to.
	 */
	channels: string[];
};

/**
 * The What's new surface. It reads the announcements of the host and has nothing to show them with yet.
 *
 * @param {WhatsNewProps} props - The props.
 * @return The surface.
 */
export function WhatsNew( { channels }: WhatsNewProps ) {
	useAnnouncements( channels );

	return null;
}
