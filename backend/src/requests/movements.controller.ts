import { Controller, Patch, Param, Req, Body, BadRequestException, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { Worker } from "worker_threads";
import { RequestsService } from "./requests.service";

@Controller("movements")
export class MovementsController {
  constructor(private readonly requestsService: RequestsService) {}

  private generatePdfInWorker(payload: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(`
        const { parentPort, workerData } = require("worker_threads");

        const sanitize = (value) => String(value ?? "N/A")
          .replace(/[\\u2018\\u2019]/g, "'")
          .replace(/[\\u201C\\u201D]/g, '"')
          .replace(/[\\u2022]/g, "-")
          .replace(/[^\\x09\\x0A\\x0D\\x20-\\x7E]/g, "-");

        const escapeText = (value) => sanitize(value)
          .replace(/\\\\/g, "\\\\\\\\")
          .replace(/\\(/g, "\\\\(")
          .replace(/\\)/g, "\\\\)");

        const wrapLine = (label, value, maxLength = 88) => {
          const prefix = label ? label + ": " : "";
          const text = (prefix + sanitize(value)).trim();
          if (text.length <= maxLength) return [text];
          const words = text.split(/\\s+/);
          const lines = [];
          let current = "";
          for (const word of words) {
            const next = current ? current + " " + word : word;
            if (next.length > maxLength && current) {
              lines.push(current);
              current = word;
            } else {
              current = next;
            }
          }
          if (current) lines.push(current);
          return lines;
        };

        const request = workerData || {};
        const rows = [
          { text: "Asset Movement Report", size: 18, bold: true, gap: 10 },
          { text: "Tracking ID: " + sanitize(request.id), size: 11 },
          { text: "Generated: " + new Date().toLocaleString(), size: 10, gap: 14 },
          { text: "Request Details", size: 13, bold: true, gap: 8 },
          ...wrapLine("Status", sanitize(request.status).replace(/_/g, " ")).map(text => ({ text })),
          ...wrapLine("Urgency", request.urgency).map(text => ({ text })),
          ...wrapLine("Date", request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "N/A").map(text => ({ text })),
          { text: "", gap: 8 },
          { text: "Item Information", size: 13, bold: true, gap: 8 },
          ...wrapLine("Name", request.itemName).map(text => ({ text })),
          ...wrapLine("Quantity", request.quantity).map(text => ({ text })),
          ...(request.assetTag ? wrapLine("Asset Tag", request.assetTag).map(text => ({ text })) : []),
          { text: "", gap: 8 },
          { text: "Requester", size: 13, bold: true, gap: 8 },
          ...wrapLine("Name", request.requestedByName).map(text => ({ text })),
          ...wrapLine("Department", request.requestedByDepartment || "N/A").map(text => ({ text })),
          { text: "", gap: 8 },
          { text: "Movement", size: 13, bold: true, gap: 8 },
          ...wrapLine("From", request.senderSiteName || "N/A").map(text => ({ text })),
          ...wrapLine("To", request.receiverSiteName || "N/A").map(text => ({ text })),
          { text: "", gap: 8 },
          { text: "Reason for Request", size: 13, bold: true, gap: 8 },
          ...wrapLine("", request.reason || "N/A").map(text => ({ text })),
        ];

        if (Array.isArray(request.history) && request.history.length) {
          rows.push({ text: "", gap: 10 }, { text: "Movement Timeline", size: 13, bold: true, gap: 8 });
          [...request.history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).forEach((entry) => {
            rows.push(
              ...wrapLine("", new Date(entry.timestamp).toLocaleString() + " - " + sanitize(entry.status).replace(/_/g, " "), 82).map(text => ({ text, bold: true })),
              ...wrapLine("Comment", entry.comment || "No comment", 82).map(text => ({ text })),
              ...wrapLine("Action by", entry.byName || "System", 82).map(text => ({ text })),
              { text: "", gap: 4 },
            );
          });
        }

        rows.push({ text: "", gap: 12 }, { text: "Asset Management System - ContactPoint 360 - Confidential Document", size: 9 });

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const left = 48;
        const top = 790;
        const bottom = 48;
        const lineHeight = 15;
        const pages = [[]];
        let y = top;

        const addLine = (row) => {
          const size = row.size || 10;
          const gap = row.gap || 0;
          if (y - lineHeight < bottom) {
            pages.push([]);
            y = top;
          }
          if (row.text) {
            pages[pages.length - 1].push("BT /" + (row.bold ? "F2" : "F1") + " " + size + " Tf " + left + " " + y.toFixed(2) + " Td (" + escapeText(row.text) + ") Tj ET");
          }
          y -= lineHeight + gap;
        };

        rows.forEach(addLine);
        const objects = [];
        const addObject = (body) => {
          objects.push(body);
          return objects.length;
        };

        const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
        const pagesId = addObject("PAGES_PLACEHOLDER");
        const fontRegularId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
        const fontBoldId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
        const pageIds = [];

        for (const pageCommands of pages) {
          const stream = pageCommands.join("\\n");
          const contentId = addObject("<< /Length " + stream.length + " >>\\nstream\\n" + stream + "\\nendstream");
          const pageId = addObject("<< /Type /Page /Parent " + pagesId + " 0 R /MediaBox [0 0 " + pageWidth + " " + pageHeight + "] /Resources << /Font << /F1 " + fontRegularId + " 0 R /F2 " + fontBoldId + " 0 R >> >> /Contents " + contentId + " 0 R >>");
          pageIds.push(pageId);
        }

        objects[pagesId - 1] = "<< /Type /Pages /Kids [" + pageIds.map(id => id + " 0 R").join(" ") + "] /Count " + pageIds.length + " >>";
        const pdfParts = ["%PDF-1.4\\n"];
        const offsets = [0];
        objects.forEach((body, index) => {
          offsets.push(pdfParts.join("").length);
          pdfParts.push((index + 1) + " 0 obj\\n" + body + "\\nendobj\\n");
        });
        const xrefOffset = pdfParts.join("").length;
        pdfParts.push("xref\\n0 " + (objects.length + 1) + "\\n0000000000 65535 f \\n");
        offsets.slice(1).forEach(offset => {
          pdfParts.push(String(offset).padStart(10, "0") + " 00000 n \\n");
        });
        pdfParts.push("trailer\\n<< /Size " + (objects.length + 1) + " /Root " + catalogId + " 0 R >>\\nstartxref\\n" + xrefOffset + "\\n%%EOF");
        parentPort.postMessage(Buffer.from(pdfParts.join("")));
      `, { eval: true, workerData: payload });

      worker.once("message", (pdfBuffer) => resolve(Buffer.from(pdfBuffer)));
      worker.once("error", reject);
      worker.once("exit", (code) => {
        if (code !== 0) reject(new Error(`PDF worker stopped with exit code ${code}`));
      });
    });
  }

  @Post("export-pdf")
  async exportPdf(@Body() body: any, @Res() res: Response) {
    const pdf = await this.generatePdfInWorker(body);
    const fileName = `asset-movement-${String(body?.id || "request").replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(pdf);
  }

  @Patch(":id/confirm-receipt")
  async confirmReceipt(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    const userEmail = body?.userEmail || req.headers["x-user"] || "superadmin@contactpoint360.com";
    const data = await this.requestsService.confirmReceipt(id, userEmail);
    return { data, message: "Receipt confirmed successfully", statusCode: 200 };
  }

  @Patch(":id/approve-staff")
  async approveStaff(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    const userEmail = req.headers["x-user"];
    if (!userEmail) {
      throw new BadRequestException("x-user header is missing");
    }
    const data = await this.requestsService.approveStaff(id, userEmail, body.comment);
    return { data, message: "Request staff-approved successfully", statusCode: 200 };
  }

  @Patch(":id/approve-ops")
  async approveOps(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    const userEmail = req.headers["x-user"];
    if (!userEmail) {
      throw new BadRequestException("x-user header is missing");
    }
    const data = await this.requestsService.approveOps(id, userEmail, body.comment);
    return { data, message: "Request ops-approved successfully", statusCode: 200 };
  }

  @Patch(":id/prepare-pickup")
  async preparePickup(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    const userEmail = req.headers["x-user"];
    if (!userEmail) {
      throw new BadRequestException("x-user header is missing");
    }
    const data = await this.requestsService.preparePickup(id, userEmail, body.comment);
    return { data, message: "Request prepared for pickup successfully", statusCode: 200 };
  }
}
