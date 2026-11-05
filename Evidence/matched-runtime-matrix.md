# Matched slider runtime matrix

This is measured, bounded simulator evidence. It does not establish a complete
runtime root cause or physical-device equivalence.

Both isolated builds use SDK10.0.402/workload402.1, iOSSDK27.1.10018,
MAUI workloadSDK10.0.110, Controls/WebView NuGet10.0.120,
Components.Web10.0.14, MudBlazor9.12.0, Debug/iossimulator-arm64,
Optimize=false, LLVM=false, SdkOnly/partial. The same iPhone14ProMax simulator
runs iOS26.5. Only the interpreter selection changes.

| One mounted slider, initial180/range0..360/step1/Immediate | Full Mono AOT | Blade-mixed `all,-MudBlazor` |
|---|---|---|
| int plain bind, no ValueLabel | Native SIGABRT |181,220,140,260 observed |
| double plain bind, no ValueLabel | Native SIGABRT |181,220,140,260 observed |
| double explicit Task.CompletedTask, no label | Native SIGABRT |181,220,140,260 observed |
| Blade exact double explicit callback, ValueLabel=true | Native SIGABRT |181,220,140,260 observed |

The Full-AOT reports match their executable UUIDs. Console assertions say Mono
attempted to JIT `MudSlider<T>.SetValueTextAsync` state-machine `MoveNext` in
AOT-only mode, with int or double. Allmixed runs completed and rendered .NET
values changed; this is not merely a JavaScript input-value observation.

Input was explicitly synthetic: the opt-in app-local driver dispatches the
actual rendered range's input event, then observes rendered .NET outputs.
There is no AfterBind/custom setter in the plain-bind cases and no preview/API
work. The explicit callback performs finite/clamp/value/count work and returns
Task.CompletedTask. Instrumentation executes outside the binding handler.

Separately, the operator's real drag on the original paired int slider at
12:20:49UTC terminated that exact installed baseline with SIGABRT and the
SetValueTextAsync/generic-sharing path. That baseline is independent of the
synthetic matrix. The owned picker hue was observed updating without exit.

The647-shape stock string selectors (mode/template/role together) and native
HTML selector control mounted in both policies without native exit. This does
not reproduce the physical647 Dictionary/RegisterShadowItem SIGSEGV, and does
not prove selector interaction or physical Release behavior.

In this controlled matrix, type, binding shape and ValueLabel did not remove
the strictFull-AOT failure. The mixed runtime selection changed allfour
outcomes. This is evidence for the runtime-policy difference; it is not proof
that every generic numeric control or every physical iOS configuration works.

Allcases coexist in one assembly, which can affect generic AOT coverage.
Original manual routes remain available. The default matched chooser mounts
no risky control until explicit selection/launch; synthetic launch is opt-in.
See matched-runtime-matrix.json for compact results. Raw reports, local paths,
device identifiers and build outputs are excluded from this public evidence.
