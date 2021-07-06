# Loco Developer Preview (LDP)

Incredibly lightweight VSCode extension to **preview** your **local** **dev** servers in editor.
LDP is an attempted replica of extension (built?) and used by [@SimonSwiss](https://twitter.com/simonswiss) as seen in his youtube tutorial videos. Note: _Simon's extension also has responsive mode controls, not present here..._

![LDP demo](./img/preview-demo.png)

This is a great solution for people like me who have a "gazillion" tabs and windows open, and hate alt-tabbing back and forth.

Simplicity was the main focus of this extension. The VSCode webview (electron's iframe equivalent) is simply pointing to your localhost server. There are other extension variants that are far more intricate and feature-rich than this (namely [vscode-browser-preview](https://github.com/auchenberg/vscode-browser-preview) by [Kenneth Auchenberg](https://twitter.com/auchenberg)).

## Basic Usage

### Launch

- `ctrl + shift + p` to open command palette
- select `"Loco Developer Preview: Launch"`

### Changing source URL

- `ctrl + shift + p` to open command palette
- select `"Loco Developer Preview: Change URL Source"`

## Credit

Thank you [Teresa Gawargy](https://www.linkedin.com/in/teresa-gawargy-7b541a168/) for the awesome logo!

## Known Issues

- No Responsive Mode Controls similar to modern browser's Developer Tools

## Release Notes

### 0.0.1

Initial release of LDP

---

**Enjoy!**
