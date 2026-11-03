# ABAP WebGUI for ADT

Companion extension for [ABAP Development Tools for VS Code](https://marketplace.visualstudio.com/items?itemName=SAPSE.adt-vscode). It adds one command:

**`ABAP: Open Webgui`** (`abap.openWebgui`)

1. Pick one of your ADT destinations.
2. Pick what to open: the base WebGUI, a transaction or an executable program.
3. SAP WebGUI opens in VS Code's built-in Simple Browser.

| Choice | URL |
| --- | --- |
| Base | `{protocol}://{host}:{port}/sap/bc/gui/sap/its/webgui` |
| Transaction | `…/webgui?~transaction=SE38` |
| Program | `…/webgui?~transaction=*SA38 RS38M-PROGRAMM=ZREPORT;DYNP_OKCODE=STRT` (URL-encoded) |

`sap-client` and `sap-language` are taken from the destination. If it has a `webGuiSaml2` property (e.g. `"disabled"`), its value is sent as `SAML2=<value>`.

## Authentication

The extension does no authentication of its own. WebGUI shows its own logon page in the browser if needed.

## Limitations

ADT has no public API for other extensions, so this extension:

- reads the destination list from ADT's `~/.adtls/destinations.json` (connection properties only, no credentials);
- cannot reuse ADT's session or object search, so the program or transaction name is typed in.

The WebGUI server is taken from the `webGuiServer` property you add to a destination in `destinations.json`, e.g. `"webGuiServer": "https://se38-black-2:44300"`.

Otherwise (RFC destinations contain no HTTP port) the first time you use a destination you are asked for the WebGUI address (a proposal is made from the application server and the standard ICM ports `80<nn>`/`443<nn>`); it is saved to `abapWebgui.systems`. SAProuter strings are not usable by a browser, so use the address your network exposes.

## Settings

| Setting | Description |
| --- | --- |
| `abapWebgui.systems` | Destination id → WebGUI address, e.g. `"A4H_001_DEVELOPER_EN": "https://host:44300"` |
| `abapWebgui.defaultProtocol` | `https` (default) or `http`, used for proposals |
| `abapWebgui.destinationsFile` | Override path of ADT's `destinations.json` |

## Development

```
npm install
npm run compile   # typecheck + bundle
npm run watch
npm run lint
npm test
npm run vsix      # build a .vsix
```

Press F5 to start an Extension Development Host.

## Publishing (later)

Before the first publish: create the publisher in the Marketplace (the `publisher` field is a placeholder), add a 128×128 PNG `icon` to `package.json`, check `repository` URLs, then `npx vsce publish`.
