import { DOMMatrix, Path2D, ImageData } from "@napi-rs/canvas";

/**
 * pdfjs-dist (usado por pdf-parse) referencia DOMMatrix/Path2D/ImageData a nivel de módulo
 * (ej. "const SCALE_MATRIX = new DOMMatrix()" en canvas.js), sin ningún chequeo — asume que
 * corre en un navegador. No los carga solo: si no están en el global antes de importarlo,
 * explota con un ReferenceError apenas se importa el módulo, incluso si nunca se usa canvas
 * de verdad (nosotros solo llamamos a getText(), nunca getImage()/getScreenshot()).
 *
 * Este archivo tiene que importarse ANTES que "pdf-parse" en cualquier módulo que lo use,
 * porque las importaciones ES se evalúan en el orden en que aparecen.
 */
const g = globalThis as Record<string, unknown>;
if (typeof g.DOMMatrix === "undefined") g.DOMMatrix = DOMMatrix;
if (typeof g.Path2D === "undefined") g.Path2D = Path2D;
if (typeof g.ImageData === "undefined") g.ImageData = ImageData;
