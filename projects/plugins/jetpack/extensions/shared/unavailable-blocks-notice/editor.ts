import registerUnavailableBlocksNotice from '.';
import type { UnavailableBlocksData } from './get-unavailable-cause';

type InitialState = {
	Jetpack_Editor_Initial_State?: { unavailable_blocks?: UnavailableBlocksData };
};

registerUnavailableBlocksNotice(
	( window as unknown as InitialState ).Jetpack_Editor_Initial_State?.unavailable_blocks
);
