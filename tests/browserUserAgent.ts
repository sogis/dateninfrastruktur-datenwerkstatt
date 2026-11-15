// Playwright WebKit on GTK advertises macOS for site compatibility. Monaco uses
// that OS token to resolve shortcuts, so match the Ubuntu runner's keyboard.
export const linuxWebKitUserAgent =
  process.platform === 'linux'
    ? 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Safari/605.1.15'
    : undefined;
