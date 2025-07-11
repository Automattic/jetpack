import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

const IsaUIStateSchema = z.object( {
	should_display_ui: z.boolean(),
} );

export function useIsaUIState() {
	return useDataSync( 'jetpack_boost_ds', 'image_size_analysis_ui_state', IsaUIStateSchema );
}
