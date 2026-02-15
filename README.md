# IPYNB Converter (VS Code Extension)

Convert Jupyter notebooks (`.ipynb`) into **Word documents (.docx)** and **PDFs** directly from VS Code.

This extension is designed for coursework and reports where you need a clean, submit-ready document that includes notebook outputs.

---

## Features

- **Export `.ipynb` → `.docx`** (primary)
- **Export `.ipynb` → `.pdf`** (optional)
- **Includes outputs** by executing the notebook during export (configurable)
- Explorer context menu actions:
  - `Export Notebook to DOCX (with outputs)`
  - `Export Notebook to PDF (with outputs)`
- Progress notifications and an Output Channel for detailed logs

---

## Requirements

### Quarto (required)

This extension uses **Quarto** as the conversion engine.

Install Quarto and confirm it works:

```powershell
quarto --version
quarto check
```
