// Intentionally empty: this block is fully declarative.
// Importing the store registers the shared AI Answers state, actions, and
// fetch-on-search callbacks on pages with this block. The SSE call itself
// lives in the store so the AI Answer block shares one source of truth with
// any future surface that wants to reuse the same panel.
import 'jetpack-search/store';
import './style.scss';
