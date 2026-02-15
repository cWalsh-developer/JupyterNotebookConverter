import * as vscode from "vscode";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";

type ExportFormat = "docx" | "pdf";
type ExecutionMode = "prompt" | "always" | "never";

export function activate(context: vscode.ExtensionContext) {
  const output = vscode.window.createOutputChannel("Notebook Export");

  const exportDocx = vscode.commands.registerCommand(
    "ipynbConverter.convertToDocx",
    async (uri?: vscode.Uri) => exportNotebook(context, uri, "docx", output),
  );

  const exportPdf = vscode.commands.registerCommand(
    "ipynbConverter.convertToPdf",
    async (uri?: vscode.Uri) => exportNotebook(context, uri, "pdf", output),
  );

  context.subscriptions.push(exportDocx, exportPdf, output);
}

async function exportNotebook(
  context: vscode.ExtensionContext,
  uri: vscode.Uri | undefined,
  format: ExportFormat,
  output: vscode.OutputChannel,
) {
  try {
    const notebookUri = await resolveNotebookUri(uri);
    if (!notebookUri) return;

    const notebookPathRaw = notebookUri.fsPath;
    if (path.extname(notebookPathRaw).toLowerCase() !== ".ipynb") {
      vscode.window.showErrorMessage("Selected file is not a .ipynb notebook.");
      return;
    }

    const cfg = vscode.workspace.getConfiguration("ipynbConverter");

    // Tooling / behavior
    const quartoPathSetting = (cfg.get<string>("quartoPath") || "").trim();
    const outputDirMode = cfg.get<string>("outputDir", "sameFolder");

    // Optional user-provided reference docx (Word styling template)
    const referenceDocSetting = (cfg.get<string>("referenceDoc") || "").trim();

    // Execution behavior: "prompt" | "always" | "never"
    const executionModeFromSettings = (
      cfg.get<string>("executionMode") || ""
    ).trim() as ExecutionMode | "";
    const legacyExecute = cfg.get<boolean>("execute", undefined as any);

    const executionMode: ExecutionMode =
      executionModeFromSettings === "always" ||
      executionModeFromSettings === "never" ||
      executionModeFromSettings === "prompt"
        ? executionModeFromSettings
        : legacyExecute === false
          ? "never"
          : legacyExecute === true
            ? "always"
            : "prompt";

    const quartoExe =
      quartoPathSetting.length > 0 ? quartoPathSetting : "quarto";

    const outDirRaw = await resolveOutputDir(outputDirMode, notebookPathRaw);
    if (!outDirRaw) return;

    // Normalize paths to reduce Windows casing/cleanup issues
    const notebookPath = path.resolve(notebookPathRaw);
    const outDir = path.resolve(outDirRaw);

    // Ensure output dir exists
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const baseName = path.basename(notebookPath, ".ipynb");
    const expectedOutput = path.join(outDir, `${baseName}.${format}`);

    // Bundled reference doc (used if user doesn't set one)
    const bundledRef = vscode.Uri.joinPath(
      context.extensionUri,
      "resources",
      "reference.docx",
    ).fsPath;

    const referenceDoc =
      referenceDocSetting.length > 0
        ? path.resolve(referenceDocSetting)
        : bundledRef;

    // Decide whether to execute the notebook
    const execute = await decideExecuteMode(executionMode);
    if (execute === undefined) return; // user cancelled

    const renderArgs: string[] = [
      "render",
      notebookPath,
      "--to",
      format,
      "--output-dir",
      outDir,
    ];

    if (execute) renderArgs.push("--execute");

    const metaPath = path.join(outDir, `.ipynbConverter-${format}-meta.yml`);

    // Apply reference doc ONLY for DOCX exports using a Quarto metadata-file (reliable)
    if (format === "docx") {
      if (!fs.existsSync(referenceDoc)) {
        throw new Error(`Reference doc not found: ${referenceDoc}`);
      }

      // YAML + Quarto behave best with forward slashes on Windows
      const refForYaml = referenceDoc.replace(/\\/g, "/");

      // Lua filter to remove gray background from output cells
      const luaFilter = vscode.Uri.joinPath(
        context.extensionUri,
        "resources",
        "no-tables.lua",
      ).fsPath;
      const luaFilterForYaml = luaFilter.replace(/\\/g, "/");

      const yaml = `format:
  docx:
    reference-doc: "${refForYaml}"
highlight-style: none
filters:
  - "${luaFilterForYaml}"
pandoc:
  wrap: auto
`;

      fs.writeFileSync(metaPath, yaml, "utf8");
      renderArgs.push("--metadata-file", metaPath);
    }

    output.clear();
    output.show(true);
    output.appendLine(`[ipynbConverter] Export started`);
    output.appendLine(`Notebook: ${notebookPath}`);
    output.appendLine(`Format: ${format}`);
    output.appendLine(`Execute before export: ${execute}`);
    output.appendLine(`Engine: Quarto`);
    output.appendLine(`Quarto exe: ${quartoExe}`);
    if (format === "docx") {
      output.appendLine(`Reference doc: ${referenceDoc}`);
      output.appendLine(`Reference doc exists: ${fs.existsSync(referenceDoc)}`);
    }
    output.appendLine(`Args: ${renderArgs.join(" | ")}`);
    output.appendLine("");

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Exporting notebook to ${format.toUpperCase()}...`,
        cancellable: false,
      },
      async () => {
        await runProcess(quartoExe, renderArgs, output);

        if (!fs.existsSync(expectedOutput)) {
          throw new Error(
            `Export failed: output file not found at ${expectedOutput}`,
          );
        }
      },
    );

    vscode.window.showInformationMessage(
      `Exported: ${path.basename(expectedOutput)}`,
    );

    // Reveal in Explorer
    const outUri = vscode.Uri.file(expectedOutput);
    await vscode.commands.executeCommand("revealFileInOS", outUri);
  } catch (err: any) {
    const msg = err?.message ? String(err.message) : String(err);
    vscode.window.showErrorMessage(`Export failed: ${msg}`);
  }
}

async function decideExecuteMode(
  mode: ExecutionMode,
): Promise<boolean | undefined> {
  if (mode === "always") return true;
  if (mode === "never") return false;

  const pick = await vscode.window.showQuickPick(
    [
      {
        label: "Export without running",
        description: "Use outputs already saved in the notebook (.ipynb)",
        value: false,
      },
      {
        label: "Run notebook then export",
        description: "Re-execute to refresh outputs before exporting",
        value: true,
      },
    ],
    {
      placeHolder: "Choose how to export this notebook",
      ignoreFocusOut: true,
    },
  );

  if (!pick) return undefined;
  return pick.value;
}

async function resolveNotebookUri(
  uri?: vscode.Uri,
): Promise<vscode.Uri | undefined> {
  if (uri) return uri;

  const active = vscode.window.activeTextEditor?.document?.uri;
  if (active && active.fsPath.toLowerCase().endsWith(".ipynb")) return active;

  const picked = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { "Jupyter Notebook": ["ipynb"] },
    openLabel: "Select notebook",
  });

  return picked?.[0];
}

async function resolveOutputDir(
  mode: string | undefined,
  notebookPath: string,
): Promise<string | undefined> {
  if (mode === "chooseEachTime") {
    const picked = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: "Choose output folder",
    });
    return picked?.[0]?.fsPath;
  }
  return path.dirname(notebookPath);
}

function runProcess(
  exe: string,
  args: string[],
  output: vscode.OutputChannel,
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Only use shell when relying on PATH ("quarto"). Avoid shell with full exe path.
    const useShell = exe.toLowerCase() === "quarto";

    const child = spawn(exe, args, {
      shell: useShell,
      windowsHide: true,
    });

    child.stdout.on("data", (d) => output.appendLine(String(d).trimEnd()));
    child.stderr.on("data", (d) => output.appendLine(String(d).trimEnd()));

    child.on("error", (err) => reject(enrichProcessError(err, exe)));
    child.on("close", (code) => {
      if (code === 0) return resolve();
      reject(
        new Error(
          `Quarto exited with code ${code}. Check 'Notebook Export' output for details.`,
        ),
      );
    });
  });
}

function enrichProcessError(err: any, exe: string): Error {
  const msg = String(err?.message || err);
  if (
    msg.toLowerCase().includes("enoent") ||
    msg.toLowerCase().includes("not found")
  ) {
    return new Error(
      `Could not run '${exe}'. Install Quarto or set ipynbConverter.quartoPath to quarto.exe.`,
    );
  }
  return new Error(msg);
}

export function deactivate() {}
