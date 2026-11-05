# Release Mono policy × linking matrix

AGENT-CONTROLLED EVIDENCE

Four isolated Release builds used the same source, SDK10.0.402, workload10.0.402.1,
iOS SDK27.1.10018, MAUI workloadSDK10.0.110 with Controls/WebView packages10.0.120,
Components.Web10.0.14 and MudBlazor9.12.0. The same named iPhone14ProMax simulator
ran iOS26.5. Native Mono is10.0.13.0/build10.0.1326.50504,
commit4099f83977f4d29604a9aeb971fb0a7bc1d5f699 in every packaged app.

`UseInterpreter=true` was constant. Only explicit `MtouchInterpreter` and
`MtouchLink` varied. SDK-evaluated TrimMode was checked; these are Mono builds,
`PublishAot=false`, LLVMfalse, with the original sample's explicit **Optimize=false**
held constant even in Release. Original source/project/global.json were unchanged;
only separate build snapshots were parameterized. Pre-existing local changes
were preserved, not represented as a clean repository.

| Interpreter selection | Link / effective trim | Stock647-shape selects | Plain int slider | Blade exact double slider |
|---|---|---|---|---|
| all,-MudBlazor | SdkOnly / partial | Native SIGSEGV during mount | 4 values passed | 4 values passed |
| all | SdkOnly / partial | Full interaction passed | 4 values passed | 4 values passed |
| all,-MudBlazor | None / copy | Native SIGSEGV during mount | 4 values passed | 4 values passed |
| all | None / copy | Full interaction passed | 4 values passed | 4 values passed |

## Native qualification and phases

All four generated `MONO_AOT_MODE_INTERP`. That label alone does **not** prove
which assembly is interpreted. In both mixed cells the generated startup registers
MudBlazor's AOT module; the final executable contains its native module symbol
and the app contains MudBlazor.aotdata.arm64. In both `all` cells all three are
absent. CoreLib's native AOT module remains registered in every cell: `all`
selection must not be described as an executable containing no native AOT code.

| Cell | PID | Native UUID | Result |
|---|---:|---|---|
| mixed-partial | 17394 | BC4442EF-82BA-3ABA-A2A9-D380E447A3F0 | Fresh matched SIGSEGV |
| all-partial | 17469 | C63B0D2F-6BBC-32C3-A15D-1B015EE18008 | Completed, alive until controlled cleanup |
| mixed-copy | 17573 | 04890DC3-287C-37D7-A068-7221E90C62CC | Fresh matched SIGSEGV |
| all-copy | 17684 | 90BE6760-8D08-3997-8820-86583492238B | Completed, alive until controlled cleanup |

Both failed cells log Starting only. They exit before Mounted, before driver
entry and before any value input. Fresh OS reports match the named simulator,
PID, executable UUID and dSYM. Both resolve through Dictionary.TryInsert,
generic-sharing trampolines, Dictionary.set_Item,
MudSelectContext.RegisterShadowItem and MudSelectItem.OnMudShadowSelectChanged.
This is the same failure **family** as the separately qualified Blade physical
and Release-simulator dropdown reports, not the slider async-binding assertion.
Exact underlying ABI/runtime cause is not established.

Both passing cells open all three real dropdowns, select Dark/Bright,
SYSTEM Ocean/USER Test copy and Secondary/Info, preserve state on same-instance
rerenders, unmount/remount and choose Dark again: **7 confirmed selections and
7 rerenders per cell**, with .NET fields/counters checked. Events are explicitly
synthetic mousedown and option clicks on the rendered controls, not finger input.
No driver failures were excluded from this final four-cell experiment.

## Slider extension: same frozen artifacts

No source changed and no build ran for the eight additional slider runs. Each
of the four artifacts tested `int-bind` and `double-task-label` separately:

- int: plain generated synchronous @bind-Value, no ValueLabel, custom setter,
  AfterBind or callback counter;
- double: explicit finite/clamp/value/count callback returning Task.CompletedTask,
  ValueLabel=true, matching the Blade variant;
- both start180, Min0/Max360/Step1/Immediate=true.

The qualified range driver dispatches synthetic actual DOM input181/220/140/260.
All **8 runs passed**, with the same live range element and every .NET rendered
value checked:32 matching values, zero native exits, fresh crashes or managed
driver failures. These Release results remain separate from the earlier
full-AOT Debug slider failures. Passing these sliders does not repair the
select mount faults in the same mixed-policy binaries.

## What this says about #6558

The [original #6558 recipe](https://github.com/MudBlazor/MudBlazor/issues/6558)
uses None plus UseInterpreter=True. The issue remains open; its activity records
unpinning on2025-11-03. In this matrix that all/copy cell passes, but all/partial
also passes. None/copy alone does not prevent the mixed-policy mount failure.
The [official property contract](https://learn.microsoft.com/en-us/dotnet/ios/building-apps/build-properties#mtouchinterpreter)
says explicit MtouchInterpreter overrides UseInterpreter, so retaining
all,-MudBlazor does not evaluate the global-interpreter recipe merely by adding
UseInterpreter=True. This supports the selected interpretation change **in this
sample**; it neither proves the exact runtime bug nor a universal/physical fix.

## Reproduction and limits

Each cell uses its own source snapshot, obj/bin and isolated NuGet/CLI/temp/clang
caches under the sample's workspace lease. Build with Release/iossimulator-arm64,
then verify effective settings, generated registration, native module presence,
UUID and matching dSYM before installing on the chosen test simulator. For the
select input sequence launch with the opt-in path
`/select-only-repro/all?drive=true`; sliders use
`/matched-sliders?case=int-bind&drive=true` or double-task-label. No automation
runs without drive=true. The root project's default full-AOT policy is preserved.

These are one-pass simulator experiments, not physical TestFlight or stress
proof. No SDK/workload/package update, NativeAOT switch, main Blade policy,
release counter or signing change occurred. Raw reports stay private; the JSON
contains sanitized symbolication and exact per-step observations. Default manual
chooser and full-AOT baseline are restored after collection. No Git publication
was performed.

[Machine-readable select and slider matrices](release-policy-matrix.json)
retain exact build flags, native module qualification, PIDs/UUIDs, sanitized
crash stacks and all32 slider observations. Prior Debug results remain in
[the original matrix](matched-runtime-matrix.md) and
[the Debug selector interaction matrix](select-interaction-matrix.md).
