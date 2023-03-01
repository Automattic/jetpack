import { derived } from 'svelte/store';
import config from '../stores/config';

export const pricing = derived( config, $config => $config.pricing );
