# MudSlider Hybrid AOT reproduction

AGENT-CONTROLLED README

Minimal, standalone **iOS .NET MAUI Blazor Hybrid** application for the supplied
MudBlazor slider crash. It has one project, no project references, no backend,
no authentication and no application-specific theme or preview callbacks.

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

## Reproduce

1. Launch the app. The color-picker page opens with `#58A6FFFF`.
2. Drag the rainbow hue slider. The confirmed Debug-AOT run exits to Home Screen.
3. Relaunch to repeat. To test the smaller diagnostic reduction separately,
   choose **Sliders only** before touching the color picker, then drag hue/alpha.

`Components/Pages/Home.razor` is the color-picker reduction.
`Components/Pages/SliderOnlyRepro.razor` is the independent integer-slider
reduction. The slider-only route compiled but has not been exercised.

## Verification and scope

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
