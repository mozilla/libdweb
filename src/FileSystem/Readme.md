# UX Flow

`FileSystem` API exposes actual filesystem API on the disk scoped to a specific directory, but in order to reduce amount oh harm such an API could cause it is scoped to a directory chosen on user's behalf.

For illustration purpouses we'll use hypothetical [beaker browser](https://beakerbrowser.com/) add-on. When add-on initiall attempts to mount a filesystem directory it would call an
API function as follows:

```js
const volume = await browser.FileSystem.mount({
  title: "Choose the default directory where your projects will be saved.",
  read: true,
  write:false,
  watch:false
})
```

**_Note:_ In this case `write` and `watch` options could be ommited**

We encourage add-ons to request only previleges that are absolutely necessary
and request additional permissions as they become necessary. Above API call
would trigger following user interaction shown below:

https://blocksplain.com/wp-content/uploads/2018/02/beaker_logo.png
