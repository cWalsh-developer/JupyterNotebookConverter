# Jupyter Notebook Converter

Convert Jupyter notebooks (`.ipynb`) into **Word documents (.docx)** and **PDFs** directly from VS Code.

This extension is perfect for creating clean, submit-ready documents from your Jupyter notebooks - ideal for coursework, reports, and documentation. All notebook outputs (tables, graphs, code results) are preserved in the exported document.

---

## Features

- 📄 **Export to DOCX** - Create formatted Word documents with proper code styling
- 📑 **Export to PDF** - Generate professional PDFs (requires TinyTeX)
- 🎨 **Smart Formatting** - Code blocks appear with gray backgrounds, data tables remain as proper tables
- 🔄 **Output Preservation** - All notebook outputs are included in the export
- ⚙️ **Configurable Execution** - Choose whether to re-run notebooks before export
- 🖱️ **Context Menu Integration** - Right-click any `.ipynb` file to export

---

## Prerequisites

### 1. Install Quarto (Required)

Quarto is the conversion engine that powers this extension.

**Installation:**

1. Download Quarto from: https://quarto.org/docs/get-started/
2. Run the installer for your operating system
3. Verify installation by opening a new terminal and running:
   ```bash
   quarto --version
   ```
4. You should see a version number (e.g., `1.4.550`)

### 2. Install TinyTeX (Optional - For PDF Export)

TinyTeX is required only if you want to export to PDF format.

**Installation:**

1. Open a terminal/command prompt
2. Run:
   ```bash
   quarto install tinytex
   ```
3. Wait for the installation to complete (may take a few minutes)
4. Verify by running:
   ```bash
   quarto check
   ```

> **Note:** If you only need DOCX exports, you can skip TinyTeX installation.

---

## Setup & Configuration

### Step 1: Install the Extension

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "ipynbConverter" or "Jupyter Notebook Converter"
4. Click **Install**

### Step 2: Configure Quarto Path (If Needed)

If Quarto is not in your system PATH, you'll need to specify its location:

1. Open VS Code Settings (File → Preferences → Settings, or Ctrl+,)
2. Search for: `ipynbConverter`
3. Find **"Quarto Path"** setting
4. Enter the full path to your Quarto executable:
   - **Windows**: `C:\Users\YourName\AppData\Local\Programs\Quarto\bin\quarto.exe`
   - **macOS**: `/usr/local/bin/quarto`
   - **Linux**: `/usr/local/bin/quarto` or `/usr/bin/quarto`

**How to find your Quarto path:**

- **Windows**: Open PowerShell and run: `Get-Command quarto | Select-Object -ExpandProperty Source`
- **macOS/Linux**: Open Terminal and run: `which quarto`

### Step 3: Configure Other Settings (Optional)

**Execution Mode:**

- Controls whether notebooks are re-executed before export
- Options:
  - `prompt` (default) - Ask each time
  - `always` - Always re-execute notebooks
  - `never` - Use existing outputs only

**Output Directory:**

- Controls where exported files are saved
- Options:
  - `sameFolder` (default) - Save next to the notebook file
  - `chooseEachTime` - Select a folder each time you export

**Reference Document (Advanced):**

- Provide a custom Word template for DOCX styling
- Leave blank to use the built-in template

---

## How to Use

### Export to DOCX

**Method 1: Context Menu (Recommended)**

1. In VS Code, right-click inside any cell of an open `.ipynb` file
2. Select **"Convert Jupyter Notebook to DOCX"**
3. Choose whether to re-execute the notebook (if prompted)
4. Wait for the export to complete
5. The DOCX file will open in your file explorer

**Method 2: Command Palette**

1. Open a `.ipynb` file in VS Code
2. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
3. Type: "Convert Jupyter Notebook to DOCX"
4. Press Enter

### Export to PDF

**Method 1: Context Menu (Recommended)**

1. In VS Code, right-click inside any cell of an open `.ipynb` file
2. Select **"Convert Jupyter Notebook to PDF"**
3. Choose whether to re-execute the notebook (if prompted)
4. Wait for the export to complete
5. The PDF file will open in your file explorer

**Method 2: Command Palette**

1. Open a `.ipynb` file in VS Code
2. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
3. Type: "Convert Jupyter Notebook to PDF"
4. Press Enter

---

## Output Formatting

The exported documents will have:

✅ **Code cells** - Gray background for easy identification  
✅ **Output tables** - Formatted as proper tables (white background)  
✅ **Markdown cells** - Rendered with proper formatting  
✅ **Images and plots** - Embedded in the document  
✅ **Text output** - Displayed in monospace font

---

## Troubleshooting

### "Quarto not found" Error

**Solution:**

1. Verify Quarto is installed: Run `quarto --version` in a terminal
2. If not installed, follow the Prerequisites section above
3. If installed but not found, set the Quarto path in settings (see Configuration)

### PDF Export Fails

**Solution:**

1. Ensure TinyTeX is installed: Run `quarto check`
2. Install TinyTeX: Run `quarto install tinytex`
3. Restart VS Code after installation

### Notebook Execution Fails

**Solution:**

1. Choose "Export without running" when prompted
2. This will use outputs already saved in the notebook
3. Or fix any code errors in the notebook before exporting

### Output Channel

For detailed logs:

1. Go to View → Output
2. Select "Notebook Export" from the dropdown
3. Check the detailed execution logs

---

## Requirements

- **VS Code**: Version 1.109.0 or higher
- **Quarto**: Latest version from https://quarto.org
- **TinyTeX**: (Optional) Only needed for PDF exports

---

## Extension Settings

This extension contributes the following settings:

- `ipynbConverter.quartoPath`: Path to the Quarto executable (leave empty if Quarto is in PATH)
- `ipynbConverter.executionMode`: How to handle notebook execution (`prompt`, `always`, `never`)
- `ipynbConverter.outputDir`: Where to save exported files (`sameFolder`, `chooseEachTime`)
- `ipynbConverter.referenceDoc`: Path to a custom Word template for DOCX exports (advanced)

---

## Known Issues

- Large notebooks may take longer to export
- Complex LaTeX equations may need additional packages for PDF export

---

## Release Notes

### 0.0.1

Initial release:

- Export Jupyter notebooks to DOCX
- Export Jupyter notebooks to PDF
- Configurable execution mode
- Smart formatting for code and output tables

---

## Support

Found a bug or have a feature request?

- GitHub: https://github.com/cWalsh-developer/JupyterNotebookConverter

---

**Enjoy exporting your Jupyter notebooks! 📊✨**
