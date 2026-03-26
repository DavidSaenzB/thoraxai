import { useState, useCallback } from "react";

const API_URL = "http://localhost:8000";

function DropZone({ onFile, preview }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith("image/")) onFile(file);
    },
    [onFile]
  );

  const handleChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => {
        handleDrag(e);
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        handleDrag(e);
        setDragOver(false);
      }}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
        dragOver
          ? "border-cyan-400 bg-cyan-950/30"
          : "border-slate-600 hover:border-slate-400 bg-slate-800/40"
      }`}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      {preview ? (
        <div className="flex flex-col items-center gap-4">
          <img
            src={preview}
            alt="X-Ray preview"
            className="max-h-72 rounded-xl border border-slate-600 shadow-lg shadow-black/40"
          />
          <p className="text-slate-400 text-sm">
            Click or drag to replace image
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-8">
          <svg
            className="w-14 h-14 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 16v-8m0 0l-3 3m3-3l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-slate-300 text-lg font-medium">
            Drop chest X-ray image here
          </p>
          <p className="text-slate-500 text-sm">or click to browse files</p>
          <p className="text-slate-600 text-xs mt-1">
            PNG, JPG, DICOM supported
          </p>
        </div>
      )}
    </div>
  );
}

function ProgressBar({ pathology, probability }) {
  const pct = (probability * 100).toFixed(1);

  let barColor, textColor, bgColor;
  if (probability > 0.5) {
    barColor = "bg-red-500";
    textColor = "text-red-400";
    bgColor = "bg-red-950/40";
  } else if (probability > 0.3) {
    barColor = "bg-yellow-500";
    textColor = "text-yellow-400";
    bgColor = "bg-yellow-950/40";
  } else {
    barColor = "bg-emerald-500";
    textColor = "text-emerald-400";
    bgColor = "bg-emerald-950/40";
  }

  return (
    <div className={`rounded-lg p-3 ${bgColor}`}>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-slate-200">{pathology}</span>
        <span className={`text-sm font-mono font-bold ${textColor}`}>
          {pct}%
        </span>
      </div>
      <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${Math.max(Number(pct), 0.5)}%` }}
        />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="w-12 h-12 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin" />
      <p className="text-slate-400 animate-pulse">
        Analyzing radiograph with AI model…
      </p>
    </div>
  );
}

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = useCallback((f) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResults(null);
    setError(null);
  }, []);

  const resetAnalysis = () => {
    setFile(null);
    setPreview(null);
    setResults(null);
    setError(null);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      setResults(data.predictions);
    } catch (err) {
      setError(err.message || "Failed to connect to the analysis server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              ThoraxAI
            </h1>
            <p className="text-xs text-slate-500">
              Advanced Pulmonary Analysis · 18 Pathology Detection
            </p>
          </div>
          <span className="ml-auto text-xs font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 rounded-full px-3 py-1">
            🟢 Model Active
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Disclaimer */}
        <div className="flex items-start gap-3 rounded-xl bg-amber-950/30 border border-amber-800/40 p-4">
          <svg
            className="w-5 h-5 text-amber-500 mt-0.5 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-amber-200/80">
            <span className="font-semibold text-amber-300">Disclaimer:</span>{" "}
            For research purposes only. Not for clinical use. AI predictions
            should always be reviewed by a qualified radiologist.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left column — Upload */}
          <section className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-300">
              Upload Radiograph
            </h2>

            <DropZone onFile={handleFile} preview={preview} />

            <button
              onClick={analyze}
              disabled={!file || loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
                bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white
                shadow-lg shadow-cyan-900/40 hover:shadow-cyan-800/50"
            >
              {loading ? "Analyzing…" : "Analyze X-Ray"}
            </button>
          </section>

          {/* Right column — Results */}
          <section className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-300">
              Analysis Results
            </h2>

            {loading && <Spinner />}

            {error && (
              <div className="rounded-xl bg-red-950/40 border border-red-800/50 p-4 text-sm text-red-300">
                <span className="font-semibold">Error:</span> {error}
              </div>
            )}

            {results && !loading && (
              <>
                <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1 custom-scrollbar">
                  {results.map((r) => (
                    <ProgressBar
                      key={r.pathology}
                      pathology={r.pathology}
                      probability={r.probability}
                    />
                  ))}
                </div>
                <button
                  onClick={resetAnalysis}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200
                    bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white
                    shadow-lg shadow-cyan-900/40 hover:shadow-cyan-800/50"
                >
                  ← New Analysis
                </button>
              </>
            )}

            {!results && !loading && !error && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                <svg
                  className="w-16 h-16 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 17v-2m3 2v-4m3 4v-6m-9 8h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm">Upload an image to begin analysis</p>
              </div>
            )}
          </section>
        </div>

        {/* Credits */}
        <footer className="border-t border-slate-800 pt-6 mt-12 text-center space-y-1">
          <p className="text-xs text-slate-500">
            Built with{" "}
            <a
              href="https://github.com/mlmed/torchxrayvision"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:text-cyan-400 underline underline-offset-2"
            >
              TorchXRayVision
            </a>{" "}
            (MIT License) · Model: DenseNet-121 pretrained on ChestX-ray14
          </p>
          <p className="text-xs text-slate-600">
            Dataset:{" "}
            <a
              href="https://nihcc.app.box.com/v/ChestXray-NIHCC"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-400 underline underline-offset-2"
            >
              NIH ChestX-ray14
            </a>{" "}
            — Wang et al., CVPR 2017
          </p>
          <p className="text-xs text-slate-500 mt-3">
            Designed & built by{" "}
            <a
              href="https://portfolio-six-hazel-64.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:text-cyan-400 underline underline-offset-2"
            >
              David Sáenz
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
