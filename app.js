import { Chess } from "./chess.js";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];
const PROMO_ORDER = ["q", "r", "b", "n"];
const PROMO_LABEL = { q: "ราชินี", r: "เรือ", b: "บิชอป", n: "ม้า" };
const PIECE_NAME = {
  wK: "ราชาขาว",
  wQ: "ราชินีขาว",
  wR: "เรือขาว",
  wB: "บิชอปขาว",
  wN: "ม้าขาว",
  wP: "เบี้ยขาว",
  bK: "ราชาดำ",
  bQ: "ราชินีดำ",
  bR: "เรือดำ",
  bB: "บิชอปดำ",
  bN: "ม้าดำ",
  bP: "เบี้ยดำ",
};

const statusEl = document.querySelector("#status");
const viewEl = document.querySelector("#view-label");
const boardEl = document.querySelector("#board");
const promo = document.querySelector("#promo");
const promoOptions = document.querySelector("#promo-options");
const historyEl = document.querySelector("#history");
const undoBtn = document.querySelector("#undo");
const sideWhite = document.querySelector("#side-white");
const sideBlack = document.querySelector("#side-black");
const autoWhiteBtn = document.querySelector("#auto-white");
const autoBlackBtn = document.querySelector("#auto-black");
const autoNote = document.querySelector("#auto-note");
const ghost = document.querySelector("#ghost");

const chess = new Chess();
let orientation = "white";
let selected = null;
let pending = null;
let engineStatus = "loading";
let advice = emptyAdvice("loading");
let autoWhite = false;
let autoBlack = false;
let thinkMs = 2000;
let autoKey = null;
const drag = { from: null, x: 0, y: 0, moved: false };
let suppressClick = false;

function asset(name) {
  return new URL(name, import.meta.url).href;
}

const PIECE_SVG = {
  wK: '<svg class="piece-svg" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path stroke-linejoin="miter" d="M22.5 11.63V6M20 8h5"/><path fill="#fff" stroke-linecap="butt" stroke-linejoin="miter" d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path fill="#fff" d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10z"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></g></svg>',
  wQ: '<svg class="piece-svg" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0m16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0M41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0M16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0M33 9a2 2 0 1 1-4 0 2 2 0 1 1 4 0"/><path stroke-linecap="butt" d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14z"/><path stroke-linecap="butt" d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path fill="none" d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0"/></g></svg>',
  wR: '<svg class="piece-svg" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path stroke-linecap="butt" d="M9 39h27v-3H9zm3-3v-4h21v4zm-1-22V9h4v2h5V9h5v2h5V9h4v5"/><path d="m34 14-3 3H14l-3-3"/><path stroke-linecap="butt" stroke-linejoin="miter" d="M31 17v12.5H14V17"/><path d="m31 29.5 1.5 2.5h-20l1.5-2.5"/><path fill="none" stroke-linejoin="miter" d="M11 14h23"/></g></svg>',
  wB: '<svg class="piece-svg" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><g fill="#fff" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path stroke-linejoin="miter" d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5"/></g></svg>',
  wN: '<svg class="piece-svg" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path fill="#fff" d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/><path fill="#fff" d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"/><path fill="#000" d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0m5.433-9.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5"/></g></svg>',
  wP: '<svg class="piece-svg" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 45 45"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 9a4 4 0 0 0-3.22 6.38 6.48 6.48 0 0 0-0.87 10.65c-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47a6.46 6.46 0 0 0-0.87-10.65A4.01 4.01 0 0 0 22.5 9z"/></g></svg>',
  bK: '<svg class="piece-svg" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path stroke-linejoin="miter" d="M22.5 11.6V6"/><path fill="#000" stroke-linecap="butt" stroke-linejoin="miter" d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path fill="#000" d="M11.5 37a22.3 22.3 0 0 0 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10z"/><path stroke-linejoin="miter" d="M20 8h5"/><path stroke="#ececec" d="M32 29.5s8.5-4 6-9.7C34.1 14 25 18 22.5 24.6v2.1-2.1C20 18 9.9 14 7 19.9c-2.5 5.6 4.8 9 4.8 9"/><path stroke="#ececec" d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></g></svg>',
  bQ: '<svg class="piece-svg" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><g fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><g stroke="none"><circle cx="6" cy="12" r="2.75"/><circle cx="14" cy="9" r="2.75"/><circle cx="22.5" cy="8" r="2.75"/><circle cx="31" cy="9" r="2.75"/><circle cx="39" cy="12" r="2.75"/></g><path stroke-linecap="butt" d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5z"/><path stroke-linecap="butt" d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path fill="none" stroke-linecap="butt" d="M11 38.5a35 35 1 0 0 23 0"/><path fill="none" stroke="#ececec" d="M11 29a35 35 1 0 1 23 0m-21.5 2.5h20m-21 3a35 35 1 0 0 22 0m-23 3a35 35 1 0 0 24 0"/></g></svg>',
  bR: '<svg class="piece-svg" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><g fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path stroke-linecap="butt" d="M9 39h27v-3H9zm3.5-7 1.5-2.5h17l1.5 2.5zm-.5 4v-4h21v4z"/><path stroke-linecap="butt" stroke-linejoin="miter" d="M14 29.5v-13h17v13z"/><path stroke-linecap="butt" d="M14 16.5 11 14h23l-3 2.5zM11 14V9h4v2h5V9h5v2h5V9h4v5z"/><path fill="none" stroke="#ececec" stroke-linejoin="miter" stroke-width="1" d="M12 35.5h21m-20-4h19m-18-2h17m-17-13h17M11 14h23"/></g></svg>',
  bB: '<svg class="piece-svg" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><g fill="#000" stroke-linecap="butt"><path d="M9 36c3.4-1 10.1.4 13.5-2 3.4 2.4 10.1 1 13.5 2 0 0 1.6.5 3 2-.7 1-1.6 1-3 .5-3.4-1-10.1.5-13.5-1-3.4 1.5-10.1 0-13.5 1-1.4.5-2.3.5-3-.5 1.4-2 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path stroke="#ececec" stroke-linejoin="miter" d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5"/></g></svg>',
  bN: '<svg class="piece-svg" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path fill="#000" d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/><path fill="#000" d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.04-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-1-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-2 2.5-3c1 0 1 3 1 3"/><path fill="#ececec" stroke="#ececec" d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0m5.43-9.75a.5 1.5 30 1 1-.86-.5.5 1.5 30 1 1 .86.5"/><path fill="#ececec" stroke="none" d="m24.55 10.4-.45 1.45.5.15c3.15 1 5.65 2.49 7.9 6.75S35.75 29.06 35.25 39l-.05.5h2.25l.05-.5c.5-10.06-.88-16.85-3.25-21.34s-5.79-6.64-9.19-7.16z"/></g></svg>',
  bP: '<svg class="piece-svg" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><path stroke="#000" stroke-linecap="round" stroke-width="1.5" d="M22.5 9a4 4 0 0 0-3.22 6.38 6.48 6.48 0 0 0-.87 10.65c-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47a6.46 6.46 0 0 0-.87-10.65A4.01 4.01 0 0 0 22.5 9z"/></svg>',
};
function pieceArt(color, type) {
  return PIECE_SVG[`${color}${String(type).toUpperCase()}`] || "";
}

function emptyAdvice(phase) {
  return {
    phase,
    san: null,
    from: null,
    to: null,
    depth: 0,
    score: "—",
    percent: 50,
    pv: "",
    explanation:
      phase === "error" ? "เครื่องวิเคราะห์ใช้ไม่ได้ชั่วคราว ยังเดินหมากเองได้ตามปกติ" : "",
    final: false,
    uci: null,
    fen: null,
    movetime: 0,
  };
}

function uciToSan(fen, uci) {
  if (!uci || uci === "(none)" || uci.length < 4) return null;
  try {
    const copy = new Chess(fen);
    return copy.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san;
  } catch {
    return null;
  }
}

function uciEnds(uci) {
  if (!uci || uci === "(none)" || uci.length < 4) return null;
  return { from: uci.slice(0, 2), to: uci.slice(2, 4) };
}

function pvToSan(fen, pv) {
  const copy = new Chess(fen);
  const out = [];
  for (const uci of pv.slice(0, 8)) {
    try {
      out.push(copy.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san);
    } catch {
      break;
    }
  }
  return out.join(" ");
}

function formatEval(whiteCp, whiteMate) {
  if (whiteMate !== null && whiteMate !== 0) return `${whiteMate > 0 ? "+" : "-"}M${Math.abs(whiteMate)}`;
  if (whiteCp === null) return "—";
  const pawns = whiteCp / 100;
  const abs = Math.abs(pawns).toFixed(2);
  if (pawns > 0) return `+${abs}`;
  if (pawns < 0) return `-${abs}`;
  return "0.00";
}

function whitePercent(whiteCp, whiteMate) {
  if (whiteMate !== null && whiteMate !== 0) return whiteMate > 0 ? 92 : 8;
  if (whiteCp === null) return 50;
  const share = 1 / (1 + Math.exp(-whiteCp / 220));
  return Math.min(92, Math.max(8, share * 100));
}

function explainMove(san, whiteCp, whiteMate) {
  let idea = "แนะนำเดินตามตานี้";
  if (san.startsWith("O-O-O")) idea = "แนะนำเข้าป้อมฝั่งควีน เพื่อให้ราชาปลอดภัยขึ้น";
  else if (san.startsWith("O-O")) idea = "แนะนำเข้าป้อมฝั่งคิง เพื่อให้ราชาปลอดภัยขึ้น";
  else if (san.includes("#")) idea = "แนะนำเดินนี้เพราะเป็นทางรุกจน";
  else if (san.includes("+")) idea = "แนะนำเดินนี้เพื่อรุก";
  else if (san.includes("x")) idea = "แนะนำจับกินในตานี้";
  else if (/^[NBRQK]/.test(san)) idea = "แนะนำพัฒนาตัวหมากในตานี้";
  else idea = "แนะนำเดินเบี้ยในตานี้";

  let balance = "ตำแหน่งใกล้เสมอ";
  if (whiteMate !== null && whiteMate !== 0) {
    const n = Math.abs(whiteMate);
    balance = whiteMate > 0 ? `ฝ่ายขาวมีทางรุกจนใน ${n} ตา` : `ฝ่ายดำมีทางรุกจนใน ${n} ตา`;
  } else if (whiteCp !== null) {
    const pawns = Math.abs(whiteCp) / 100;
    const side = whiteCp >= 0 ? "ฝ่ายขาว" : "ฝ่ายดำ";
    if (pawns < 0.25) balance = "ตำแหน่งใกล้เสมอ";
    else if (pawns < 0.9) balance = `${side}ได้เปรียบเล็กน้อย`;
    else if (pawns < 2) balance = `${side}ได้เปรียบ`;
    else balance = `${side}ได้เปรียบชัดเจน`;
  }
  return `${idea} ${balance}`;
}

function viewFrom(update, phase) {
  if (!update || !update.uci) {
    if (update && update.final) {
      return {
        ...emptyAdvice("error"),
        explanation: "เครื่องวิเคราะห์ไม่พบตาที่แนะนำในตอนนี้",
      };
    }
    return emptyAdvice(phase);
  }
  const san = uciToSan(update.fen, update.uci);
  const ends = uciEnds(update.uci);
  if (!san || !ends) {
    return {
      ...emptyAdvice(update.final ? "error" : phase),
      explanation: update.final ? "เครื่องวิเคราะห์ตอบกลับตาที่เดินไม่ได้" : "",
    };
  }
  const turn = update.fen.split(" ")[1] === "b" ? "b" : "w";
  const sign = turn === "w" ? 1 : -1;
  const whiteCp = update.cp === null ? null : update.cp * sign;
  const whiteMate = update.mate === null ? null : update.mate * sign;
  return {
    phase,
    san,
    from: ends.from,
    to: ends.to,
    depth: update.depth,
    score: formatEval(whiteCp, whiteMate),
    percent: whitePercent(whiteCp, whiteMate),
    pv: pvToSan(update.fen, update.pv),
    explanation: explainMove(san, whiteCp, whiteMate),
    final: update.final,
    uci: update.uci,
    fen: update.fen,
    movetime: update.movetime ?? 0,
  };
}

function chosenThink() {
  const autoOn = !chess.isGameOver() && (chess.turn() === "w" ? autoWhite : autoBlack);
  if (autoOn) return thinkMs;
  const narrow = window.innerWidth < 800 || window.matchMedia("(pointer: coarse)").matches;
  return narrow ? 700 : 1200;
}

function maybeAuto() {
  const autoOn = !chess.isGameOver() && (chess.turn() === "w" ? autoWhite : autoBlack);
  if (!autoOn || pending) return;
  if (!advice.final || advice.movetime !== thinkMs || advice.fen !== chess.fen() || !advice.uci) return;
  if (autoKey === chess.fen()) return;
  autoKey = chess.fen();
  const uci = advice.uci;
  const promotion = uci.length >= 5 ? uci[4] : undefined;
  play(uci.slice(0, 2), uci.slice(2, 4), promotion);
}

function linesOf(data) {
  if (typeof data !== "string") return [];
  return data
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseInfo(line) {
  if (!line.startsWith("info ") || !line.includes(" pv ")) return null;
  const depth = /(?:^|\s)depth (\d+)/.exec(line);
  const mate = /score mate (-?\d+)/.exec(line);
  const cp = /score cp (-?\d+)/.exec(line);
  const pv = line.split(" pv ")[1]?.trim().split(/\s+/) ?? [];
  const first = pv[0];
  if (!first || first.length < 4 || first === "pv") return null;
  return {
    uci: first,
    cp: cp ? Number(cp[1]) : null,
    mate: mate ? Number(mate[1]) : null,
    depth: depth ? Number(depth[1]) : 0,
    pv,
  };
}

const engine = {
  worker: null,
  booted: false,
  searching: false,
  stopSent: false,
  activeFen: null,
  wantFen: null,
  activeTime: 0,
  wantTime: 0,
  partial: null,
  bootTimer: 0,
  start() {
    try {
      this.worker = new Worker(asset("stockfish-19-lite-single.js"));
    } catch {
      failEngine();
      return;
    }
    this.bootTimer = window.setTimeout(() => {
      if (!this.booted) failEngine();
    }, 20000);
    this.worker.onerror = () => failEngine();
    this.worker.onmessage = (event) => {
      for (const line of linesOf(event.data)) this.consume(line);
    };
    this.worker.postMessage("uci");
  },
  analyze(fen, movetime) {
    this.wantFen = fen;
    this.wantTime = movetime;
    this.pump();
  },
  clear() {
    this.wantFen = null;
    this.partial = null;
    if (this.searching && this.worker && !this.stopSent) {
      this.stopSent = true;
      this.worker.postMessage("stop");
    }
  },
  pump() {
    if (!this.booted || !this.worker || !this.wantFen) return;
    if (this.searching) {
      const stale = this.activeFen !== this.wantFen || this.activeTime !== this.wantTime;
      if (stale && !this.stopSent) {
        this.stopSent = true;
        this.worker.postMessage("stop");
      }
      return;
    }
    this.activeFen = this.wantFen;
    this.activeTime = this.wantTime;
    this.searching = true;
    this.stopSent = false;
    this.partial = null;
    this.worker.postMessage(`position fen ${this.wantFen}`);
    this.worker.postMessage(`go movetime ${this.activeTime}`);
  },
  consume(line) {
    if (line === "uciok") {
      this.worker.postMessage("setoption name Hash value 16");
      this.worker.postMessage("setoption name UCI_AnalyseMode value true");
      this.worker.postMessage("isready");
      return;
    }
    if (line === "readyok") {
      if (!this.booted) {
        this.booted = true;
        window.clearTimeout(this.bootTimer);
        engineStatus = "ready";
        if (!chess.isGameOver()) this.analyze(chess.fen(), chosenThink());
        else render();
      }
      this.pump();
      return;
    }
    if (line.startsWith("bestmove ")) {
      const finished = this.activeFen;
      const discarded = this.stopSent || finished !== this.wantFen || this.activeTime !== this.wantTime;
      const uci = line.split(/\s+/)[1] ?? null;
      const movetime = this.activeTime;
      this.searching = false;
      this.stopSent = false;
      if (!discarded && finished && finished === chess.fen()) {
        const info = this.partial;
        advice = viewFrom(
          {
            fen: finished,
            final: true,
            uci: uci && uci !== "(none)" ? uci : null,
            cp: info?.cp ?? null,
            mate: info?.mate ?? null,
            depth: info?.depth ?? 0,
            pv: info?.pv ?? (uci && uci !== "(none)" ? [uci] : []),
            movetime,
          },
          "ready",
        );
        render();
      }
      this.pump();
      return;
    }
    if (this.stopSent || !this.activeFen || this.activeFen !== this.wantFen) return;
    if (this.activeFen !== chess.fen()) return;
    const info = parseInfo(line);
    if (!info) return;
    this.partial = info;
    advice = viewFrom({ fen: this.activeFen, final: false, movetime: this.activeTime, ...info }, "thinking");
    render();
  },
};

function failEngine() {
  window.clearTimeout(engine.bootTimer);
  engine.worker?.terminate();
  engine.worker = null;
  engine.booted = false;
  engine.searching = false;
  engineStatus = "error";
  advice = emptyAdvice("error");
  render();
}

function snap() {
  const history = chess.history({ verbose: true });
  const last = history[history.length - 1];
  let result = "playing";
  let label = chess.turn() === "w" ? "ตาของฝ่ายขาว" : "ตาของฝ่ายดำ";
  if (chess.isCheckmate()) {
    result = "mate";
    label = chess.turn() === "w" ? "รุกจน — ฝ่ายดำชนะ" : "รุกจน — ฝ่ายขาวชนะ";
  } else if (chess.isStalemate()) {
    result = "stalemate";
    label = "อับ — เสมอ";
  } else if (chess.isThreefoldRepetition()) {
    result = "draw";
    label = "เสมอ — ตำแหน่งซ้ำสามครั้ง";
  } else if (chess.isDrawByFiftyMoves()) {
    result = "draw";
    label = "เสมอ — ครบห้าสิบตาโดยไม่จับกินหรือเดินเบี้ย";
  } else if (chess.isInsufficientMaterial()) {
    result = "draw";
    label = "เสมอ — ตัวหมากไม่พอรุกจน";
  } else if (chess.isDraw()) {
    result = "draw";
    label = "เสมอ";
  } else if (chess.isCheck()) {
    result = "check";
    label = chess.turn() === "w" ? "รุก — ตาของฝ่ายขาว" : "รุก — ตาของฝ่ายดำ";
  }
  const king = chess.isCheck() ? chess.findPiece({ type: "k", color: chess.turn() })[0] : null;
  return {
    label,
    result,
    over: chess.isGameOver(),
    turn: chess.turn(),
    sans: chess.history(),
    lastFrom: last?.from ?? null,
    lastTo: last?.to ?? null,
    checkSquare: king ?? null,
  };
}

function pieces() {
  const map = new Map();
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell) map.set(cell.square, cell);
    }
  }
  return map;
}

function squaresFor() {
  const files = orientation === "white" ? FILES : [...FILES].reverse();
  const ranks = orientation === "white" ? RANKS : [...RANKS].reverse();
  const squares = [];
  for (const rank of ranks) for (const file of files) squares.push(`${file}${rank}`);
  return squares;
}

function coords(square) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  const col = orientation === "white" ? file : 7 - file;
  const row = orientation === "white" ? 7 - rank : rank;
  return { x: col + 0.5, y: row + 0.5 };
}

function arrowMarkup(from, to) {
  const a = coords(from);
  const b = coords(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const start = { x: a.x + ux * 0.15, y: a.y + uy * 0.15 };
  const end = { x: b.x - ux * 0.35, y: b.y - uy * 0.35 };
  return `<svg class="arrow" viewBox="0 0 8 8" aria-hidden="true">
    <defs><marker id="best-arrow" markerWidth="2.2" markerHeight="2.2" refX="1.2" refY="1.1" orient="auto"><path d="M0 0 L2.2 1.1 L0 2.2 Z" fill="currentColor"/></marker></defs>
    <line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="currentColor" stroke-width="0.16" stroke-linecap="round" marker-end="url(#best-arrow)" opacity="0.9"/>
  </svg>`;
}

function render() {
  const position = snap();
  const map = pieces();
  const legal = !selected || position.over || pending
    ? []
    : chess.moves({ square: selected, verbose: true }).map((move) => move.to);
  const showMove = advice.san && (advice.phase === "ready" || advice.phase === "thinking");

  statusEl.textContent = position.label;
  statusEl.className = `status${position.result === "check" ? " check" : ""}${position.result !== "playing" && position.result !== "check" ? " over" : ""}`;
  viewEl.textContent = orientation === "white" ? "มุมมองฝ่ายขาว" : "มุมมองฝ่ายดำ";
  sideWhite.className = orientation === "white" ? "btn btn-brass" : "btn btn-ghost";
  sideBlack.className = orientation === "black" ? "btn btn-brass" : "btn btn-ghost";
  sideWhite.setAttribute("aria-pressed", String(orientation === "white"));
  sideBlack.setAttribute("aria-pressed", String(orientation === "black"));
  undoBtn.disabled = !pending && position.sans.length === 0;
  paintToggle(autoWhiteBtn, autoWhite);
  paintToggle(autoBlackBtn, autoBlack);
  for (const button of document.querySelectorAll("[data-think]")) {
    const on = Number(button.getAttribute("data-think")) === thinkMs;
    button.className = on ? "btn btn-brass" : "btn btn-ghost";
    button.setAttribute("aria-pressed", String(on));
  }
  const autoOn = !position.over && (position.turn === "w" ? autoWhite : autoBlack);
  if (autoOn) {
    autoNote.hidden = false;
    autoNote.textContent = thinkMs >= 1000 ? `กำลังคิด ${thinkMs / 1000} วินาที แล้วจะเดินให้` : "กำลังเดินให้ทันที";
  } else autoNote.hidden = true;

  if (position.sans.length === 0) {
    historyEl.innerHTML = `<p class="muted">ยังไม่มีการเดิน</p>`;
  } else {
    let rows = "";
    for (let i = 0; i < position.sans.length; i += 2) {
      rows += `<tr><td class="num">${i / 2 + 1}</td><td>${position.sans[i] ?? ""}</td><td>${position.sans[i + 1] ?? ""}</td></tr>`;
    }
    historyEl.innerHTML = `<table><thead><tr><th>ตา</th><th>ขาว</th><th>ดำ</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  const interactive = !position.over && !pending && !autoOn;
  const html = squaresFor()
    .map((square) => {
      const file = square[0];
      const rank = square[1];
      const light = (file.charCodeAt(0) + Number(rank)) % 2 === 1;
      const piece = map.get(square);
      const isLast = square === position.lastFrom || square === position.lastTo;
      const isBest = showMove && (square === advice.from || square === advice.to);
      const isSelected = square === selected;
      const canLand = legal.includes(square);
      const showFile = orientation === "white" ? rank === "1" : rank === "8";
      const showRank = orientation === "white" ? file === "a" : file === "h";
      const name = piece ? PIECE_NAME[`${piece.color}${piece.type.toUpperCase()}`] : "";
      const label = piece ? `ช่อง ${square} ${name}` : `ช่อง ${square} ว่าง`;
      const hidden = drag.moved && drag.from === square;
      return `<button type="button" class="sq${light ? " light" : ""}" data-square="${square}" aria-label="${label}" aria-pressed="${isSelected}" ${interactive ? "" : "tabindex='-1'"}>
        ${isLast ? `<span class="wash last"></span>` : ""}
        ${isBest ? `<span class="ring"></span>` : ""}
        ${isSelected ? `<span class="wash sel"></span>` : ""}
        ${square === position.checkSquare ? `<span class="wash check"></span>` : ""}
        ${showRank ? `<span class="coord rank">${rank}</span>` : ""}
        ${showFile ? `<span class="coord file">${file}</span>` : ""}
        ${canLand && !piece ? `<span class="dot"></span>` : ""}
        ${canLand && piece ? `<span class="capture"></span>` : ""}
        ${piece && !hidden ? pieceArt(piece.color, piece.type) : ""}
      </button>`;
    })
    .join("");
  boardEl.innerHTML = `<div class="grid">${html}</div>${showMove && advice.from && advice.to ? arrowMarkup(advice.from, advice.to) : ""}`;

  if (pending) {
    promo.hidden = false;
    promoOptions.innerHTML = pending.options
      .map(
        (piece) => `<button type="button" data-promo="${piece}">
          ${pieceArt(position.turn, piece)}
          ${PROMO_LABEL[piece]}
        </button>`,
      )
      .join("");
  } else promo.hidden = true;
  maybeAuto();
}

function afterMove() {
  pending = null;
  selected = null;
  if (chess.isGameOver()) {
    engine.clear();
    advice = emptyAdvice("idle");
  } else if (engineStatus === "error") advice = emptyAdvice("error");
  else if (engineStatus !== "ready") advice = emptyAdvice("loading");
  else {
    advice = emptyAdvice("thinking");
    engine.analyze(chess.fen(), chosenThink());
  }
  render();
  historyEl.scrollTop = historyEl.scrollHeight;
}

function play(from, to, promotion) {
  if (chess.isGameOver()) return;
  const choices = chess.moves({ square: from, verbose: true }).filter((move) => move.to === to);
  if (!choices.length) return;
  const promotions = choices.map((move) => move.promotion).filter(Boolean);
  if (promotions.length && !promotion) {
    const unique = PROMO_ORDER.filter((piece) => promotions.includes(piece));
    pending = { from, to, options: unique.length ? unique : promotions };
    selected = from;
    render();
    return;
  }
  try {
    chess.move({ from, to, promotion });
  } catch {
    return;
  }
  afterMove();
}

function cellOf(target) {
  if (!(target instanceof Element)) return null;
  return target.closest("[data-square]")?.getAttribute("data-square") ?? null;
}

document.querySelector("#new-game").addEventListener("click", () => {
  autoKey = null;
  chess.reset();
  afterMove();
});

undoBtn.addEventListener("click", () => {
  autoKey = null;
  if (pending) {
    selected = pending.from;
    pending = null;
    render();
    return;
  }
  if (!chess.history().length) return;
  chess.undo();
  afterMove();
});

sideWhite.addEventListener("click", () => {
  orientation = "white";
  render();
});
sideBlack.addEventListener("click", () => {
  orientation = "black";
  render();
});

function paintToggle(button, on) {
  button.className = on ? "btn btn-brass" : "btn btn-ghost";
  button.setAttribute("aria-pressed", String(on));
}

autoWhiteBtn.addEventListener("click", () => {
  autoWhite = !autoWhite;
  autoKey = null;
  if (!chess.isGameOver() && engineStatus === "ready") {
    advice = emptyAdvice("thinking");
    engine.analyze(chess.fen(), chosenThink());
  }
  render();
});
autoBlackBtn.addEventListener("click", () => {
  autoBlack = !autoBlack;
  autoKey = null;
  if (!chess.isGameOver() && engineStatus === "ready") {
    advice = emptyAdvice("thinking");
    engine.analyze(chess.fen(), chosenThink());
  }
  render();
});
document.querySelector("#think-times").addEventListener("click", (event) => {
  const button = event.target.closest("[data-think]");
  if (!button) return;
  thinkMs = Number(button.getAttribute("data-think"));
  autoKey = null;
  if (!chess.isGameOver() && engineStatus === "ready") {
    advice = emptyAdvice("thinking");
    engine.analyze(chess.fen(), chosenThink());
  }
  render();
});

document.querySelector("#promo-cancel").addEventListener("click", () => {
  if (!pending) return;
  selected = pending.from;
  pending = null;
  render();
});

promoOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-promo]");
  if (!button || !pending) return;
  play(pending.from, pending.to, button.getAttribute("data-promo"));
});

boardEl.addEventListener("click", (event) => {
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  const square = cellOf(event.target);
  if (!square || chess.isGameOver() || pending) return;
  const legal = selected
    ? chess.moves({ square: selected, verbose: true }).some((move) => move.to === square)
    : false;
  if (selected && legal) {
    play(selected, square);
    return;
  }
  const piece = chess.get(square);
  selected = piece && piece.color === chess.turn() ? square : null;
  render();
});

boardEl.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || chess.isGameOver() || pending) return;
  const square = cellOf(event.target);
  if (!square) return;
  const piece = chess.get(square);
  if (!piece || piece.color !== chess.turn()) return;
  drag.from = square;
  drag.x = event.clientX;
  drag.y = event.clientY;
  drag.moved = false;
  selected = square;
});

window.addEventListener("pointermove", (event) => {
  if (!drag.from) return;
  if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 8) {
    drag.moved = true;
    const piece = chess.get(drag.from);
    if (piece) {
      ghost.innerHTML = pieceArt(piece.color, piece.type);
      ghost.hidden = false;
    }
    render();
  }
  if (drag.moved) {
    ghost.style.left = `${event.clientX}px`;
    ghost.style.top = `${event.clientY}px`;
  }
});

function endDrag(event) {
  const from = drag.from;
  const moved = drag.moved;
  drag.from = null;
  drag.moved = false;
  ghost.hidden = true;
  if (!from || !moved) return;
  suppressClick = true;
  window.setTimeout(() => {
    suppressClick = false;
  }, 0);
  const square = cellOf(document.elementFromPoint(event.clientX, event.clientY));
  if (square && square !== from) play(from, square);
  else render();
}

window.addEventListener("pointerup", endDrag);
window.addEventListener("pointercancel", endDrag);

render();
engine.start();
