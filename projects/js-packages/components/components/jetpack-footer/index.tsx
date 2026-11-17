import './style.scss';
import UnstyledJetpackFooter from './jetpack-footer.tsx';
import type { JetpackFooterProps } from './types.ts';
import type { FC } from 'react';

// A pure re-export would let bundlers that honour `sideEffects` drop the style import above.
const JetpackFooter: FC< JetpackFooterProps > = props => <UnstyledJetpackFooter { ...props } />;

export default JetpackFooter;
