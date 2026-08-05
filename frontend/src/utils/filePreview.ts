type PreviewCallback = (blob: Blob, filename: string) => void;

let previewCallback: PreviewCallback | null = null;

export const registerPreviewHandler = (callback: PreviewCallback) => {
  previewCallback = callback;
};

export const unregisterPreviewHandler = () => {
  previewCallback = null;
};

export const requestFilePreview = (blob: Blob, filename: string) => {
  if (previewCallback) {
    previewCallback(blob, filename);
  } else {
    // Fallback: download directly if handler is not registered
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
