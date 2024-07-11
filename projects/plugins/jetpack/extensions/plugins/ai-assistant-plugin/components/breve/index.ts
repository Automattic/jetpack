import Controls from './controls';
import { store } from './store'; // Register the store

const Breve = Controls as () => React.JSX.Element;

export { Breve };
export { default as Highlight, registerBreveHighlights } from './highlight';
export { store };
