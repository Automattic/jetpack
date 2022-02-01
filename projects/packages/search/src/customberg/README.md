# Jetpack Search Customization Experience (Customberg)

Custom configuration page for Jetpack Search, henceforth referred to as "Customberg".

## Build (& Watch)

This package will be built via `pnpm run build-search-configure`, which is invoked in both `pnpm build` and `pnpm run build-search`. Alternatively, you can watch for changes via `pnpm run build-search-configure -- --watch` or `pnpm watch-search`.

## How this works

Customberg is styled after many other existing block editors, like the WordPress Widgets editor and the WordPress Post editor. While it is architected to allow for block editing in the future, specifically in the Jetpack Search sidebar, it currently does not support any block editing features at the time of writing.

Customberg allows Jetpack Search site owners to change and preview Jetpack Search configuration changes. We enable this Customizer-like experience by rendering the complete Instant Search Preact application in a React context. The components are interoperable between Preact and React.
