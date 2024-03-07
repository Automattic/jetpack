type MyJetpackState = Window[ 'myJetpackInitialState' ];

type ReturnType< A extends keyof MyJetpackState > = A extends null
	? MyJetpackState
	: MyJetpackState[ A ];

const getMyJetpackWindowState = < A extends keyof MyJetpackState >( key?: A ): ReturnType< A > => {
	if ( ! key ) {
		return window?.myJetpackInitialState as ReturnType< A >;
	}

	return ( window?.myJetpackInitialState?.[ key ] ?? null ) as ReturnType< A >;
};

export default getMyJetpackWindowState;
