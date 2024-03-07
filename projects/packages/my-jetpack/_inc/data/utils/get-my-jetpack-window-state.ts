type MyJetpackState = Window[ 'myJetpackInitialState' ];

const getMyJetpackWindowState = < A extends keyof MyJetpackState >(
	key: A,
	defaultValue: MyJetpackState[ A ]
) => window?.myJetpackInitialState?.[ key ] ?? defaultValue;

export default getMyJetpackWindowState;
