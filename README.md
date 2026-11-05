# MudSlider Hybrid AOT reproduction

AGENT-CONTROLLED README

Minimal, standalone **iOS .NET MAUI Blazor Hybrid** application for the supplied
MudBlazor slider crash, with App-owned controls for comparison. It has one
project, no project references, no backend, no authentication and no theme-preview
callbacks. Every control has a visible component-name heading and an Owned or
MudBlazor label.

**A crash is reproduced in Debug with Mono AOT enabled.** On an Apple Silicon
iPhone 14 Pro Max simulator running iOS 26.5, dragging the color picker's hue
slider terminated the app. The operator also confirmed the crash. The new native
report records `EXC_CRASH` / `SIGABRT` on the main thread. Its runtime assertion is:

```text
mini-generic-sharing.c:2761
condition `is_ok (error)' not met, function:mini_instantiate_gshared_info
Attempting to JIT compile method
'void MudBlazor.MudSlider`1/<SetValueTextAsync>d__91<int>:MoveNext ()'
while running in aot-only mode.
```

The original physical-device Release report has `iface_offset != -1`; this
Debug simulator result has the attempted-JIT assertion above. Both enter the
slider's async generic-sharing path. Identical root cause is not established.
See [the sanitized new crash extract](Evidence/debug-aot-crash.txt).

## Versions

| Item | Sample |
| --- | --- |
| Target | `net10.0-ios` |
| .NET SDK | `10.0.402`, exact pin in `global.json` |
| Workload set | `10.0.402.1` |
| iOS SDK pack | `27.1.10018` |
| MAUI workload SDK | `10.0.110` |
| MAUI Controls package | `10.0.120` |
| MAUI Blazor WebView package | `10.0.120` |
| Components / Components.Web, resolved | `10.0.14` |
| Components.WebView, resolved | `10.0.0` |
| MudBlazor | `9.12.0` |
| .NET runtime in built runtimeconfig | `10.0.13` |

The supplied report records a repository SDK pin of `10.0.403`, but explicitly
does not establish the SDK actually used for its archive. This sample uses the
installed `10.0.402` for its verified Debug-AOT build. The MAUI workload
SDK version and the explicit MAUI NuGet package versions are separate facts.

## AOT in Debug

The project explicitly sets the following for iOS, including Debug:

```xml
<PublishAot>false</PublishAot>
<UseInterpreter>false</UseInterpreter>
<MtouchInterpreter></MtouchInterpreter>
<MtouchUseLlvm>false</MtouchUseLlvm>
<MtouchLink>SdkOnly</MtouchLink>
<Optimize>false</Optimize>
```

This selects **Mono AOT** on `ios-arm64` and `iossimulator-arm64`. The iOS SDK
selects AOT for these architectures even in Debug. `PublishAot=true` would select
the different NativeAOT deployment path. No interpreter workaround is applied.
Hot Reload requires the interpreter, so disable Hot Reload for this baseline
and use an ordinary Debug build and launch.

References: [Microsoft interpreter documentation](https://learn.microsoft.com/en-us/dotnet/maui/macios/interpreter?view=net-maui-10.0)
and [iOS build properties](https://learn.microsoft.com/en-us/dotnet/ios/building-apps/build-properties).

## Build and run on an Apple Silicon Mac

Use the solution in an iOS-capable IDE, or run these commands **from this folder**.
Install .NET SDK 10.0.402 and the pinned MAUI/iOS workloads when absent:

```sh
dotnet workload restore
dotnet build MudSliderHybridRepro.csproj -c Debug -r iossimulator-arm64
xcrun simctl list devices available
```

Choose a booted simulator UUID from that list:

```sh
repro_simulator_id=YOUR_SIMULATOR_UUID
xcrun simctl install "$repro_simulator_id" bin/Debug/net10.0-ios/iossimulator-arm64/MudSliderHybridRepro.app
xcrun simctl launch "$repro_simulator_id" com.example.mudsliderhybridrepro
```

The simulator requires no developer signing profile. The project's bundle ID is
an example. For a physical iPhone, choose your own bundle ID and development
signing identity/profile, then build `-c Debug -r ios-arm64` and deploy with your
usual iOS tooling. No signing credentials or profiles are supplied.

## Compare and reproduce

| Page | Owned section | MudBlazor section |
| --- | --- | --- |
| **Color pickers** | `AppMudColorPicker`, with its own hue/alpha ranges, saturation/brightness plane and HEX field | Static `MudColorPicker` using the original parameters |
| **Sliders** | Two nongeneric `AppMudColorSlider` instances | Two original `MudSlider<int>` instances |

Owned controls appear first on a phone and on the left on a wide display. Each
implementation has separate state: pickers start at `#58A6FFFF`, and the slider
pairs start at hue 180 / alpha 255. Changing one implementation does not change
the other implementation's values. Sections are labelled with their exact
component names and implementation ownership; each range has a hue/alpha label.

1. Launch the app and test **AppMudColorPicker — Owned**: drag hue, alpha and the
   saturation/brightness plane; edit HEX. Observe its displayed value.
2. Scroll to **MudColorPicker — MudBlazor** and drag its rainbow hue slider to
   exercise the original crash baseline. A native crash ends the entire app.
3. Relaunch and choose **Sliders**. Test **AppMudColorSlider — Owned**, then
   **MudSlider<int> — MudBlazor**; each pair displays its own current values.

The comparison pages are `Components/Pages/Home.razor` and
`Components/Pages/SliderOnlyRepro.razor`. The prior baseline crash extract remains
in `Evidence/debug-aot-crash.txt`; current comparison verification is recorded
separately below.

## Owned component sources and assets

The standalone copies live in [Components/Owned](Components/Owned/README.md).
Their native-range input, HSV/HEX conversion, pointer capture, pending-input
coalescing and disposal behavior come from the App-owned implementation. The
standalone adaptations change the C# namespace, add explicit imports (including
the Blazor focus-event alias), and replace App resource lookup with fixed English
demo labels. The demo does not import the App's resource system or projects.

TypeScript and Sass sources are included along with their generated JS/CSS.
Ordinary `dotnet build` uses the checked-in assets and requires no Node tooling.
After changing the owned TypeScript or Sass, regenerate with:

```sh
npm ci --ignore-scripts
npm run build:assets
```

The lockfile pins TypeScript 5.9.2 and Sass 1.93.1. Edit the `.ts` / `.scss` sources
and regenerate; do not edit `wwwroot/owned-controls.js` or `.css` directly.

## Current comparison verification

The combined demo was built and exercised in **Debug Mono AOT** on the same
arm64 iPhone 14 Pro Max / iOS 26.5 simulator:

| Component label | Observed result |
| --- | --- |
| **AppMudColorSlider — Owned** | Hue and alpha updated without a crash. The standard sliders kept their independent values. |
| **AppMudColorPicker — Owned** | Hue, alpha, SV-plane dragging and HEX editing updated the canonical color without a crash. Invalid HEX displayed validation and preserved the published color. |
| **MudSlider<int> — MudBlazor** | Hue dragging terminated the app with SIGABRT. |
| **MudColorPicker — MudBlazor** | After relaunch, hue dragging terminated the app with SIGABRT. |

Both new standard-control crashes report an attempt to JIT-compile the generic
`MudSlider<int>.SetValueTextAsync` async `MoveNext` in AOT-only mode. The
[sanitized comparison evidence](Evidence/owned-comparison.txt) includes observed
values, both assertions and native frames. This is bounded simulator evidence;
it does not prove physical-device Release behavior or an identical root cause
to the original `iface_offset != -1` report.

The combined Debug build passed with zero errors and the same two local Xcode
preferences deprecation warnings. TypeScript/Sass asset generation passed.
Physical-device, Release/TestFlight, tablet/rotation, RTL/keyboard, disabled and
stress checks were not run for this comparison.

## Original baseline verification and scope

- Debug `iossimulator-arm64` build passed with zero errors; two local Xcode
  preferences deprecation warnings remained.
- Effective `_ComputeVariables` values were `UseMonoRuntime=true`,
  `_RunAotCompiler=true`, `UseInterpreter=false`, empty `MtouchInterpreter`,
  `PublishAot=false`, `MtouchUseLlvm=false`, `TrimMode=partial`, `Optimize=false`.
- SDK outputs include `MudBlazor.dll.o` and packaged `MudBlazor.aotdata.arm64`.
- The installed sample rendered its initial color correctly and crashed during
  the hue-slider gesture. The new report's frames include
  `MudSlider<T_GSHAREDVT>.SetValueTextAsync` and async builder `GSHAREDVT` frames.
- Physical-device Debug, Release/TestFlight, alpha-only, slider-only and
  tablet/rotation checks were not run. Android and Windows are outside this
  deliberately iOS-only sample.

Empty local `Directory.Build.props` and `Directory.Build.targets` keep the sample
independent of parent build imports when cloned inside another checkout.
NuGet.Config supplies only nuget.org. This repository contains the source and a
sanitized crash extract. Build outputs, signing material, raw crash reports and
local logs are excluded from version control.
