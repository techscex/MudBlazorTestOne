namespace MudSliderHybridRepro;

internal static class ReproDiagnostics
{
    private static readonly object Gate = new();
    internal static void Mark(string phase, string caseName, string? detail = null)
    {
        var line = DateTimeOffset.UtcNow.ToString("O") + "|" + phase + "|" + caseName + "|" + (detail ?? "").Replace('\n', ' ').Replace('\r', ' ');
        Console.WriteLine("REPRO " + line);
        lock (Gate) File.AppendAllText(Path.Combine(FileSystem.AppDataDirectory, "repro-events.log"), line + Environment.NewLine);
    }
}
