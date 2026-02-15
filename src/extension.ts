import * as vscode from "vscode";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";

type ExportFormat = "docx" | "pdf";

export function activate(context: vscode.ExtensionContext) {
  const output = vscode.window.createOutputChannel("Notebook Export");

  const exportDocx = vscode.commands.registerCommand(
    "ipynbExporter.exportDocx",
    async (uri?: vscode.Uri) => exportNotebook(uri, "docx", output),
  );

  const exportPdf = vscode.commands.registerCommand(
    "ipynbExporter.exportPdf",
    async (uri?: vscode.Uri) => exportNotebook(uri, "pdf", output),
  );

  context.subscriptions.push(exportDocx, exportPdf, output);
}

async function exportNotebook(
  uri: vscode.Uri | undefined,
  format: ExportFormat,
  output: vscode.OutputChannel,
) {
  try {
    const notebookUri = await resolveNotebookUri(uri);
    if (!notebookUri) return;

    const notebookPath = notebookUri.fsPath;
    if (path.extname(notebookPath).toLowerCase() !== ".ipynb") {
      vscode.window.showErrorMessage("Selected file is not a .ipynb notebook.");
      return;
    }

    const cfg = vscode.workspace.getConfiguration("ipynbExporter");
    const quartoPathSetting = (cfg.get<string>("quartoPath") || "").trim();
    const execute = cfg.get<boolean>("execute", true);
    const outputDirMode = cfg.get<string>("outputDir", "sameFolder");

    const quartoExe =
      quartoPathSetting.length > 0 ? quartoPathSetting : "quarto";

    const outDir = await resolveOutputDir(outputDirMode, notebookPath);
    if (!outDir) return;

    // Ensure output dir exists
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const baseName = path.basename(notebookPath, ".ipynb");
    const expectedOutput = path.join(outDir, `${baseName}.${format}`);

    const renderArgs: string[] = ["render", notebookPath, "--to", format];

    if (execute) renderArgs.push("--execute");

    output.clear();
    output.show(true);
    output.appendLine(`[ipynbExporter] Export started`);
    output.appendLine(`Notebook: ${notebookPath}`);
    output.appendLine(`Format: ${format}`);
    output.appendLine(`Execute: ${execute}`);
    output.appendLine(`Engine: Quarto`);
    output.appendLine(
      `Command: ${quartoExe} ${renderArgs.map((a) => JSON.stringify(a)).join(" ")}`,
    );
    output.appendLine("");

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Exporting notebook to ${format.toUpperCase()}...`,
        cancellable: false,
      },
      async () => {
        await runProcess(quartoExe, renderArgs, output);

        // Quarto output default location is alongside the notebook
        const defaultOut = path.join(
          path.dirname(notebookPath),
          `${baseName}.${format}`,
        );

        // Move to chosen output directory if needed
        if (path.normalize(defaultOut) !== path.normalize(expectedOutput)) {
          if (!fs.existsSync(defaultOut)) {
            throw new Error(
              `Export finished but expected output was not found: ${defaultOut}`,
            );
          }
          // If target exists, overwrite
          if (fs.existsSync(expectedOutput)) fs.unlinkSync(expectedOutput);
          fs.renameSync(defaultOut, expectedOutput);
        }

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
    const child = spawn(exe, args, {
      shell: true, // important on Windows for PATH resolution
      windowsHide: true,
    });

    child.stdout.on("data", (d) => output.appendLine(String(d).trimEnd()));
    child.stderr.on("data", (d) => output.appendLine(String(d).trimEnd()));

    child.on("error", (err) => {
      reject(enrichProcessError(err, exe));
    });

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
      `Could not run '${exe}'. Install Quarto or set ipynbExporter.quartoPath to quarto.exe.`,
    );
  }
  return new Error(msg);
}

export function deactivate() {}
