// Register the hook that customize the core Twitter embed block.
import './editor';

// This is deliberately exporting an empty object so we don't break `getExtensions`
// but we also don't want to register any new plugin or block.
export const settings = {};
