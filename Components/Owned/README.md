# Owned color controls

AGENT-CONTROLLED README

These standalone copies provide the **Owned** comparison sections in the demo.
They preserve the App-owned implementation's input and color behavior while
removing its project and localization dependencies.

- `AppMudColorSlider.razor` is a nongeneric component with a native HTML range,
  invariant parsing, bounds checks and `double` value callbacks.
- `AppMudColorPicker.razor` / `.razor.cs` compose those ranges with an SV plane,
  HEX editing, canonical `#RRGGBBAA` values, disabled guards and async disposal.
- `AppMudColorValue.cs` owns RGB/HSV conversion and HEX normalization.
- `AppMudColorPicker.ts` owns SV pointer/keyboard input, scoped pointer capture,
  latest-value coalescing and listener cleanup. It keeps the
  `RdsUI.AppColorPicker.attach` entry point used by the C# component.
- Both `.razor.scss` files own their component classes. The demo compiles them
  into a single global stylesheet with unique `app-color-*` selectors.

Standalone adaptations are limited to the C# namespace, explicit component/JS
imports, the Blazor `FocusEventArgs` alias required in a MAUI project, and fixed
English strings in place of App resource lookup. The AOT/trimming
`DynamicDependency` and `JSInvokable` annotations remain intact. No MudBlazor
slider or picker implementation is copied or forked.

Both owned types are named visibly on the comparison pages. Their state is
independent from the corresponding MudBlazor control, so an owned edit does not
feed the upstream baseline. They are copies owned by this demo; no build reads
another checkout, and there is no implicit synchronization.

To update assets, run `npm ci --ignore-scripts` and `npm run build:assets` at the
repository root. `tsconfig.json` compiles only this picker TypeScript source.
`Styles/owned-controls.scss` combines both component Sass sources. Commit the
regenerated `wwwroot/owned-controls.js` and `.css` with source changes so an
ordinary .NET build remains independent of Node.

See the [root README](../../README.md) for versions, Debug Mono AOT configuration,
comparison instructions and actual native verification limits.
