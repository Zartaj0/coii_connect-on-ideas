import { addaColor } from "@/data/adda";
import type { AddaLook } from "@/data/adda";
import { iconUrl } from "@/data/icons";
import { CELL_ASPECT, cardGrid, shareTitle, SHARE_URL } from "@/ui/addaShare";
import type { CardFace } from "@/ui/addaShare";
import { drawAvatarPixels } from "@/ui/avatar";
import { textOn } from "@/ui/color";

/** 16:9 at 1600 × 900: crisp on X and LinkedIn, small enough to share from a phone. */
export const CARD_W = 1600;
export const CARD_H = 900;

const INK = "#1e1538";
const INK_SOFT = "#4a4166";
const FLOOR = "#ece4ff";
const FLOOR_LINE = "#dfd3fb";
const PAPER = "#ffffff";
const MARIGOLD = "#ffb31a";
const DISPLAY = '"Baloo 2", "Arial Rounded MT Bold", sans-serif';
const BODY = '"Mukta", system-ui, sans-serif';

const BAND_H = 210;
const GRID = { x: 70, y: 272, w: CARD_W - 140, h: 540 };
const FOOTER_Y = 862;

async function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

/** Cuts a name down with "…" until it fits `maxWidth` in the current font. */
export function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

function drawFloor(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = FLOOR;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.strokeStyle = FLOOR_LINE;
  ctx.lineWidth = 2;
  for (let x = 0; x <= CARD_W; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CARD_H);
    ctx.stroke();
  }
  for (let y = 0; y <= CARD_H; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CARD_W, y);
    ctx.stroke();
  }
}

/** The adda-coloured awning across the top, with a scalloped edge like the stalls. */
function drawBand(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, CARD_W, BAND_H);
  const scallop = 40;
  for (let i = 0; i * scallop * 2 < CARD_W; i++) {
    ctx.beginPath();
    ctx.arc(i * scallop * 2 + scallop, BAND_H, scallop, 0, Math.PI);
    ctx.fillStyle = i % 2 ? PAPER : color;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
  ctx.fillStyle = INK;
  ctx.fillRect(0, BAND_H - 3, CARD_W, 6);
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  faces: readonly CardFace[],
  color: string,
  tent: HTMLImageElement,
): void {
  const ink = textOn(color);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = ink;
  ctx.font = `800 92px ${DISPLAY}`;
  ctx.fillText(fitText(ctx, shareTitle(faces), CARD_W - 360), 70, 112);
  ctx.font = `700 36px ${BODY}`;
  const people = faces.length === 1 ? "1 person" : `${faces.length} people`;
  ctx.fillText(`${people} meeting at Devcon 8 · Mumbai`, 74, 166);
  ctx.drawImage(tent, CARD_W - 250, 22, 170, 170);
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  face: CardFace,
  x: number,
  y: number,
  cell: number,
): void {
  const disc = cell * 0.7;
  const cx = x + cell / 2;
  const cy = y + disc / 2 + cell * 0.04;
  ctx.beginPath();
  ctx.arc(cx + 4, cy + 4, disc / 2, 0, Math.PI * 2);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, disc / 2, 0, Math.PI * 2);
  ctx.fillStyle = face.host ? MARIGOLD : PAPER;
  ctx.fill();
  ctx.lineWidth = Math.max(3, cell * 0.022);
  ctx.strokeStyle = INK;
  ctx.stroke();
  const bean = document.createElement("canvas");
  const size = Math.round(disc * 0.92);
  drawAvatarPixels(bean, face.avatar, face.topic, size, "happy");
  ctx.drawImage(bean, cx - size / 2, cy - size / 2 + disc * 0.02);
  drawName(ctx, face, cx, cy + disc / 2, cell);
}

/** The name on one line if it fits, else first name over the rest; each line cut to fit. */
export function nameLines(ctx: CanvasRenderingContext2D, name: string, maxWidth: number): string[] {
  if (ctx.measureText(name).width <= maxWidth) return [name];
  const [first = name, ...rest] = name.split(" ");
  const lines = [first, rest.join(" ")].filter((line) => line.length > 0);
  return lines.map((line) => fitText(ctx, line, maxWidth));
}

function drawName(
  ctx: CanvasRenderingContext2D,
  face: CardFace,
  cx: number,
  top: number,
  cell: number,
): void {
  const size = Math.max(18, Math.min(38, cell * 0.15));
  ctx.font = `800 ${size}px ${DISPLAY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = INK;
  const lines = nameLines(ctx, face.name, cell * 0.94);
  lines.forEach((line, i) => ctx.fillText(line, cx, top + size * (0.35 + i * 1.05)));
  if (!face.host) return;
  ctx.font = `700 ${size * 0.62}px ${BODY}`;
  ctx.fillStyle = INK_SOFT;
  ctx.fillText("host", cx, top + size * (0.4 + lines.length * 1.05));
}

function drawGrid(ctx: CanvasRenderingContext2D, faces: readonly CardFace[]): void {
  const { cols, rows, cell } = cardGrid(faces.length, GRID.w, GRID.h);
  const cellH = cell * CELL_ASPECT;
  const top = GRID.y + (GRID.h - rows * cellH) / 2;
  faces.forEach((face, i) => {
    const row = Math.floor(i / cols);
    const inRow = row === rows - 1 ? faces.length - row * cols : cols;
    const left = GRID.x + (GRID.w - inRow * cell) / 2;
    drawFace(ctx, face, left + (i % cols) * cell, top + row * cellH, cell);
  });
}

function drawFooter(ctx: CanvasRenderingContext2D): void {
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.font = `800 48px ${DISPLAY}`;
  ctx.fillText("coii", 70, FOOTER_Y);
  const wordmark = ctx.measureText("coii").width;
  ctx.font = `700 26px ${BODY}`;
  ctx.fillStyle = INK_SOFT;
  ctx.fillText("connect on ideas & interests", 86 + wordmark, FOOTER_Y - 6);
  ctx.textAlign = "right";
  ctx.font = `800 30px ${DISPLAY}`;
  ctx.fillStyle = INK;
  ctx.fillText(SHARE_URL.replace("https://", ""), CARD_W - 70, FOOTER_Y - 4);
}

/**
 * Draws the share card for your adda: your crew's faces and names under an awning in the
 * adda's colour. Waits for the fonts so the names render in the app's type.
 */
export async function drawAddaCard(
  faces: readonly CardFace[],
  look: AddaLook,
): Promise<HTMLCanvasElement> {
  await Promise.all([
    document.fonts.load(`800 48px "Baloo 2"`),
    document.fonts.load(`700 24px "Mukta"`),
  ]);
  const tent = await loadImage(iconUrl("circus_tent"));
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable, so the adda card cannot be drawn");
  const color = addaColor(look.color).css;
  drawFloor(ctx);
  drawBand(ctx, color);
  drawHeader(ctx, faces, color, tent);
  drawGrid(ctx, faces);
  drawFooter(ctx);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the card"))),
      "image/png",
    );
  });
}
