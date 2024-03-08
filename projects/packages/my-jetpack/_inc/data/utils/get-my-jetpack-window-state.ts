type MyJetpackState = Window[ 'myJetpackInitialState' ];

type ReturnType< A > = A extends undefined
	? MyJetpackState
	: MyJetpackState[ A extends keyof MyJetpackState ? A : never ];

const getMyJetpackWindowState = < A extends keyof MyJetpackState | undefined = undefined >(
	key?: A
): ReturnType< A > => {
	if ( ! key ) {
		return window?.myJetpackInitialState as ReturnType< A >;
	}

	return ( window?.myJetpackInitialState?.[ key ] ?? null ) as ReturnType< A >;
};

export default getMyJetpackWindowState;
