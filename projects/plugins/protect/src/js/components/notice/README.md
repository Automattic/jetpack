# Notice

A simple notice component for displaying alerts and messages to the user.

## Usage

```jsx
<Notice
    type="info"
    message="Code is poetry."
/>
```

## Props

Supported `type` values are `info`, `success`, `warning`, and `error`.

`spokenMessage` is the plain-text announcement for screen readers, used when `message` carries markup. `id` identifies the notice, so an identical repeat announces again.