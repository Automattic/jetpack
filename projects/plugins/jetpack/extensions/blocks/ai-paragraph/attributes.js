// Added state because with the way gutenberg works, replacing the inner blocks
// doesn't mark the block as dirty, we need to update an attribute after the
// inner blocks have been replaced.  This makes the preview button work after
// the block is rendered.
export const STATE = Object.freeze( {
	DEFAULT: '',
	PROCESSING: 'processing',
	RENDERING: 'rendering',
	DONE: 'done',
} );

export default {
	state: {
		enum: [ STATE.DEFAULT, STATE.PROCESSING, STATE.RENDERING, STATE.DONE ],
		default: STATE.DEFAULT,
	},
};
