namespace MudSliderHybridRepro;

public partial class MainPage : ContentPage
{
	public MainPage()
	{
		InitializeComponent();
        // Explicit simulator diagnostic launch; ordinary entry remains unchanged.
        var startPath = Environment.GetEnvironmentVariable("REPRO_START_PATH");
        if (startPath is not null && (startPath.StartsWith("/matched-sliders", StringComparison.Ordinal)
            || startPath.StartsWith("/select-only-repro", StringComparison.Ordinal)))
            blazorWebView.StartPath = startPath;
	}
}
