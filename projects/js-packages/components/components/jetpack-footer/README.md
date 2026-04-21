# Jetpack Admin Footer

Component that renders Jetpack Admin Footer.

## How to use

Note that most of the time you would just use `admin-page` component, which includes the footer. If you must use footer independently, basic usage is:

```js
<JetpackFooter />
```

In special occasions you might want to use custom className or additional menu links:

```js
const menu = [
  {
    label: "Support",
    href="https://wordpress.com/support/",
  },
  {
    label: "Chat",
    onClick: () => {},
  }
];

<JetpackFooter menu={ menu } className="my-footer" />
```

## Props

- `className`: String - (default: `jetpack-footer`) the additional class name set on the element.
- `menu`: JetpackFooterMenuItem[] - (default: `undefined`) set additional menu items to be rendered in the footer.
