import jsPDF from "jspdf";

export const drawPdfHeader = async (doc: jsPDF, title: string) => {
  // 1. Draw Header Banner with Brand Theme Color (33, 12, 174)
  doc.setFillColor(33, 12, 174);
  doc.rect(0, 0, 210, 24, 'F');
  
  // 2. Draw Title Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), 14, 15);

  // 3. Draw ContactPoint 360 Logo
  try {
    const logoImg = await new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = "/logo.png";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });

    if (logoImg && logoImg.width > 0 && logoImg.height > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = logoImg.width;
      canvas.height = logoImg.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(logoImg, 0, 0);
        const logoDataUrl = canvas.toDataURL("image/png");

        const badgeX = 155;
        const badgeY = 3;
        const badgeW = 44;
        const badgeH = 18;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3, 3, 'F');

        const maxW = 38;
        const maxH = 14;
        const aspect = logoImg.width / logoImg.height;
        let renderW = maxW;
        let renderH = maxW / aspect;

        if (renderH > maxH) {
          renderH = maxH;
          renderW = maxH * aspect;
        }

        const renderX = badgeX + (badgeW - renderW) / 2;
        const renderY = badgeY + (badgeH - renderH) / 2;

        doc.addImage(logoDataUrl, "PNG", renderX, renderY, renderW, renderH);
      }
    }
  } catch (e) {
    console.error("Error drawing logo in PDF header:", e);
  }
};
