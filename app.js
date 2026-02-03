/**************************
         Hero Renderer
***************************/
const PUBLISHED_ID =
  "2PACX-1vR_A5xOSS-7DWmktaI4WSZiD9QI3J62hNtWLe3DR8AlouZ48r0hooQ4OJp9Qim0N0zvKw5ZhbhgoW0K";

const GIDS = {
  intro: "914608819",
  event: "404463967",
  slot: "2087683200",
  showcase: "1651172148",
  sample: "216052396",
  collab: "1446614463",
  price: "1179234622",
  notice: "934515441",
  form: "1361764806",
};

document.addEventListener("DOMContentLoaded", () => {
  initHero().catch((err) => {
    console.error("[hero] init failed:", err);
    const hero = document.querySelector("#hero");
    if (hero) hero.innerHTML = `<p style="padding:16px">데이터를 불러오지 못했습니다. 콘솔을 확인해주세요.</p>`;
  });

  initShowcase().catch((err) => {
    console.error("[showcase] init failed:", err);
    const sc = document.querySelector("#showcase");
    if (sc) sc.innerHTML = `<p style="padding:16px">Showcase 데이터를 불러오지 못했습니다.</p>`;
  });

  initSample().catch((err) => {
    console.error("[sample] init failed:", err);
    const s = document.querySelector("#sample");
    if (s) s.innerHTML = `<p style="padding:16px">Sample 데이터를 불러오지 못했습니다.</p>`;
  });

  initCollab().catch((err) => {
    console.error("[collab] init failed:", err);
    const c = document.querySelector("#collab");
    if (c) c.innerHTML = `<p style="padding:16px">협업 작가 데이터를 불러오지 못했습니다.</p>`;
  });

  initPrice().catch((err) => {
    console.error("[price] init failed:", err);
    const p = document.querySelector("#price");
    if (p) p.innerHTML = `<p style="padding:16px">가격표 데이터를 불러오지 못했습니다.</p>`;
  });

  initNotice().catch(console.error);

  initForm().catch((err) => {
  console.error("[form] init failed:", err);
  const f = document.querySelector("#form");
  if (f) f.innerHTML = `<p style="padding:16px">문의 폼 데이터를 불러오지 못했습니다.</p>`;
});

});

/**************************
        Data Fetch
***************************/
async function fetchSheetRows(gid) {
  const url =
    `https://docs.google.com/spreadsheets/d/e/${encodeURIComponent(PUBLISHED_ID)}` +
    `/pub?output=csv&gid=${encodeURIComponent(gid)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed (gid=${gid}): ${res.status}`);

  const csvText = await res.text();
  return csvToObjects(csvText);
}

function csvToObjects(csvText) {
  const rows = parseCsv(csvText);
  if (!rows.length) return [];

  // 헤더 공백/대소문자 흔들려도 안전하게 처리
  const headers = rows[0].map((h) => normalizeKey(h));
  const body = rows.slice(1);

  return body
    .map((r) => {
      const obj = {};
      headers.forEach((h, i) => {
        if (!h) return;
        obj[h] = (r[i] ?? "").toString().trim();
      });
      return obj;
    })
    .filter((row) => Object.values(row).some((v) => String(v).trim() !== ""));
}

function parseCsv(text) {
  const out = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        row.push(cur);
        cur = "";
      } else if (ch === "\n") {
        row.push(cur);
        out.push(row);
        row = [];
        cur = "";
      } else if (ch !== "\r") cur += ch;
    }
  }

  row.push(cur);
  out.push(row);

  while (out.length && out[out.length - 1].every((c) => (c ?? "").trim() === "")) out.pop();
  return out;
}

function normalizeKey(k) {
  return (k ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ""); // " youtube " 같은 헤더 흔들림 방지
}

/**************************
            Init
***************************/
async function initHero() {
  const hero = document.querySelector("#hero");
  if (!hero) return;

  hero.innerHTML = `
    <div class="hero-wrap fx-wrap">
      <div class="hero-left">
        <article class="hero-card hero-intro" data-card="intro"></article>
        <article class="hero-card hero-event" data-card="event"></article>
      </div>
      <div class="hero-right">
        <article class="hero-card hero-slot" data-card="slot"></article>
      </div>
    </div>
  `;

  const [introRows, eventRows, slotRows] = await Promise.all([
    fetchSheetRows(GIDS.intro),
    fetchSheetRows(GIDS.event),
    fetchSheetRows(GIDS.slot),
  ]);

  renderIntro(introRows);
  renderEvent(eventRows);
  renderSlot(slotRows);
  applyFxToAllWraps();
  window.addEventListener("resize", debounce(applyFxToAllWraps, 200));
}

/**************************
        Render: Intro
***************************/
function renderIntro(rows) {
  const el = document.querySelector('[data-card="intro"]');
  if (!el) return;

  const getByType = (t) => rows.filter((r) => (r.type || "").toLowerCase() === t);

  const title = getByType("title")[0]?.content || "작가 소개";
  const descs = getByType("desc").map((r) => r.content).filter(Boolean);
  const tags = getByType("tag").map((r) => r.content).filter(Boolean);

  const descHtml = descs.length
    ? descs.map((d) => `<p class="intro-desc">${escapeHtml(d)}</p>`).join("")
    : `<p class="intro-desc">소개 문구를 추가해주세요.</p>`;

  const tagHtml = tags.length
    ? `<div class="tag-row">${tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>`
    : "";

  el.innerHTML = `
    <header class="card-head"></header>
    <div class="card-body">
      <h3 class="intro-title">${escapeHtml(title)}</h3>
      <div class="intro-text">${descHtml}</div>
      ${tagHtml}
      <div class="intro-cta-placeholder"></div>
    </div>
  `;
}

/**************************
        Render: Event
***************************/
function renderEvent(rows) {
  const el = document.querySelector('[data-card="event"]');
  if (!el) return;

  const actives = rows.filter((r) => truthy(r.active));
  const event = actives[0] || rows[0];

  if (!event) {
    el.innerHTML = `
      <header class="card-head"><h2 class="card-title">이벤트 안내</h2></header>
      <div class="card-body"><p class="muted">현재 진행 중인 이벤트가 없습니다.</p></div>
    `;
    return;
  }

  const badge = (event.badge || "").trim();

  el.innerHTML = `
    <header class="card-head"><h2 class="card-title">이벤트 안내</h2></header>
    <div class="card-body">
      ${(event.title || event.subtitle || badge)
        ? `
        <div class="event-top">
          ${event.title ? `<h3 class="event-title">${escapeHtml(event.title)}</h3>` : ""}
          ${event.subtitle ? `<span class="event-sub-inline">${escapeHtml(event.subtitle)}</span>` : ""}
          ${badge ? `<span class="badge">${escapeHtml(badge)}</span>` : ""}
        </div>
      `
        : ""}
      ${event.desc ? `<p class="event-desc">${escapeHtml(event.desc)}</p>` : ""}
    </div>
  `;
}

/**************************
        Render: Slot
***************************/
function renderSlot(rows) {
  const el = document.querySelector('[data-card="slot"]');
  if (!el) return;

  if (!rows.length) {
    el.innerHTML = `
      <header class="card-head"><h2 class="card-title">작업 슬롯</h2></header>
      <div class="card-body">
        <p class="muted">등록된 슬롯 정보가 없습니다.</p>
        <div class="hero-actions">
          <a name="goto" class="hero-btn hero-btn-primary" href="form">문의 작성하러 가기</a>
          <a name="goto" class="hero-btn hero-btn-secondary" href="sample">리깅 샘플 보러가기</a>
        </div>
      </div>
    `;
    return;
  }

  const listHtml = rows
    .map((r) => {
      const month = (r.month || "").trim();
      const total = toInt(r.total);
      const reserved = clamp(toInt(r.reserved), 0, total);

      const emptyCount = Math.max(0, total - reserved);
      const icons = "♠".repeat(reserved) + "♤".repeat(emptyCount);

      return `
        <li class="slot-item">
          <div class="slot-month">${escapeHtml(month)}</div>
          <div class="slot-meta"><span class="slot-icons" aria-label="reserved/empty">${icons}</span></div>
        </li>
      `;
    })
    .join("");

  el.innerHTML = `
    <header class="card-head"><h2 class="card-title">작업 슬롯</h2></header>
    <div class="card-body">
      <div class="slot-legend">
        <span class="legend"><b>♤</b> 빈 슬롯</span>
        <span class="legend"><b>♠</b> 예약 완료</span>
      </div>
      <ul class="slot-list">${listHtml}</ul>
      <p class="slot-note muted">최근 3개월 일정만 안내드립니다. 이후 일정도 문의 주시면 조율 가능합니다.</p>
      <div class="hero-actions">
        <a class="hero-btn hero-btn-primary" href="form">문의 작성하러 가기</a>
        <a class="hero-btn hero-btn-secondary" href="sample">리깅 샘플 보러가기</a>
      </div>
    </div>
  `;
}

/**************************
       Showcase Renderer
***************************/
async function initShowcase() {
  const root = document.querySelector("#showcase");
  if (!root) return;

  root.innerHTML = `
    <div class="sc-wrap fx-wrap">
      <header class="sc-head">
        <h2 class="sc-title">Showcase</h2>
        <p class="sc-desc">지금까지 작업했던 리깅 Showcase 영상입니다. 우측으로 넘길수록 오래된 작업물입니다.</p>
      </header>

      <div class="sc-slider" data-sc="slider">
        <button class="sc-nav sc-prev" type="button" aria-label="이전">‹</button>
        <div class="sc-viewport">
          <ul class="sc-track" data-sc="track"></ul>
        </div>
        <button class="sc-nav sc-next" type="button" aria-label="다음">›</button>
      </div>

      <div class="sc-dots" data-sc="dots" aria-label="슬라이드 위치"></div>
    </div>
  `;

  const rows = await fetchSheetRows(GIDS.showcase);

  // ✅ active 비어있으면 기본 표시, FALSE면 숨김
  const items = rows
    .filter((r) => {
      const a = (r.active ?? "").toString().trim();
      return a === "" || truthy(a);
    })
    .map((r) => {
      const youtube = (r.youtube || "").trim();
      const vid = getYouTubeId(youtube);

      if (!vid && youtube) console.warn("[showcase] invalid youtube url:", youtube, r);

      return {
        order: toInt(r.order),
        title: (r.title || "").trim(),
        youtube,
        caption: (r.caption || "").trim(),
        price: (r.price || "").trim(),
        vid,
        ratio: (r.ratio || "").trim(),
        fit: (r.fit || "").trim(),
      };
    })
    .filter((x) => x.vid);

  items.sort((a, b) => (a.order || 0) - (b.order || 0));

  console.log("[showcase] rows:", rows.length, "items:", items.length);

  renderShowcase(items);
  applyFxToAllWraps();
}

function renderShowcase(items) {
  const track = document.querySelector('[data-sc="track"]');
  const dots = document.querySelector('[data-sc="dots"]');
  const prev = document.querySelector(".sc-prev");
  const next = document.querySelector(".sc-next");
  const viewport = document.querySelector("#showcase .sc-viewport");

  if (!track || !dots || !prev || !next || !viewport) return;

  if (!items.length) {
    track.innerHTML = `<li class="sc-empty">등록된 쇼케이스가 없습니다.</li>`;
    prev.disabled = true;
    next.disabled = true;
    return;
  }

  // slides (✅ button → a 로 변경 / 클릭 시 유튜브 새탭 이동)
  track.innerHTML = items
    .map((it, idx) => {
      const ytUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(it.vid)}`;
      const t = it.title ? `<h3 class="sc-item-title">${escapeHtml(it.title)}</h3>` : "";
      const p = it.price ? `<p class="sc-item-price">${escapeHtml(it.price)}</p>` : "";
      const c = it.caption ? `<p class="sc-item-cap">${nl2br(escapeHtml(it.caption))}</p>` : "";

      return `
        <li class="sc-item" data-idx="${idx}">
          <a class="sc-thumb"
             href="${ytUrl}"
             target="_blank"
             rel="noopener noreferrer"
             aria-label="유튜브로 이동">
            <img
              src="${getYouTubeThumb(it.vid, 'max')}"
              alt="YouTube thumbnail"
              loading="lazy"
              onerror="this.onerror=null; this.src='${getYouTubeThumb(it.vid, 'hq')}';"
            />
            <span class="sc-play" aria-hidden="true">▶</span>
          </a>
          <div class="sc-meta">
            ${t}
            ${p}
            ${c}
          </div>
        </li>
      `;
    })
    .join("");

  // ✅ 슬라이드 폭 고정 (scrollWidth 확보)
  syncShowcaseSlideWidths(track, viewport);

  // dots
  dots.innerHTML = items
    .map((_, i) => `<button type="button" class="sc-dot" data-dot="${i}" aria-label="${i + 1}번 슬라이드"></button>`)
    .join("");

  let cur = 0;
  const total = items.length;

  const getGap = () => {
    const cs = getComputedStyle(track);
    const g = parseFloat(cs.gap || cs.columnGap || "0");
    return Number.isFinite(g) ? g : 0;
  };

  const stepPx = () => viewport.clientWidth + getGap();

  const scrollToIndex = (idx, behavior = "smooth") => {
    const left = stepPx() * idx;
    try {
      viewport.scrollTo({ left, behavior });
    } catch {
      viewport.scrollLeft = left;
    }
  };

  const setActive = (n, behavior = "smooth") => {
    cur = clamp(n, 0, total - 1);
    scrollToIndex(cur, behavior);

    dots.querySelectorAll(".sc-dot").forEach((d, i) => d.classList.toggle("is-active", i === cur));
    prev.disabled = cur === 0;
    next.disabled = cur === total - 1;
  };

  // 버튼
  prev.onclick = () => setActive(cur - 1);
  next.onclick = () => setActive(cur + 1);

  // dots
  dots.onclick = (e) => {
    const btn = e.target.closest(".sc-dot");
    if (!btn) return;
    setActive(toInt(btn.dataset.dot));
  };

  // 사용자가 드래그/휠로 스크롤해도 현재 인덱스 유지
  viewport.addEventListener(
    "scroll",
    debounce(() => {
      const idx = Math.round(viewport.scrollLeft / Math.max(1, stepPx()));
      const nextIdx = clamp(idx, 0, total - 1);
      if (nextIdx === cur) return;
      cur = nextIdx;

      dots.querySelectorAll(".sc-dot").forEach((d, i) => d.classList.toggle("is-active", i === cur));
      prev.disabled = cur === 0;
      next.disabled = cur === total - 1;
    }, 80)
  );

  // resize: 폭 재동기화 + 위치 유지
  window.addEventListener(
    "resize",
    debounce(() => {
      syncShowcaseSlideWidths(track, viewport);
      setActive(cur, "auto");
    }, 150)
  );

  setActive(0, "auto");
}

function syncShowcaseSlideWidths(track, viewport) {
  if (!track || !viewport) return;
  const w = viewport.clientWidth;
  [...track.children].forEach((li) => {
    li.style.width = w + "px";
    li.style.flex = "0 0 auto";
  });
}


/******** YouTube helpers ********/
function getYouTubeId(url) {
  const s = (url || "").trim();
  if (!s) return "";

  let m = s.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (m?.[1]) return m[1];

  m = s.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (m?.[1]) return m[1];

  m = s.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/);
  if (m?.[1]) return m[1];

  m = s.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (m?.[1]) return m[1];

  return "";
}

function getYouTubeThumb(vid, quality = "hq") {
  const file =
    quality === "max" ? "maxresdefault.jpg" :
    quality === "sd"  ? "sddefault.jpg" :
    quality === "mq"  ? "mqdefault.jpg" :
                        "hqdefault.jpg";

  return `https://img.youtube.com/vi/${vid}/${file}`;
}

function nl2br(s) {
  return (s || "").replace(/\r?\n/g, "<br>");
}

/**************************
            Utils
***************************/
function truthy(v) {
  const s = (v ?? "").toString().trim().toLowerCase();
  return s === "true" || s === "1" || s === "y" || s === "yes" || s === "t";
}

function toInt(v) {
  const n = parseInt((v ?? "").toString().replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

function escapeHtml(str) {
  return (str ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/**************************
        Collab Renderer
***************************/
async function initCollab() {
  const root = document.querySelector("#collab");
  if (!root) return;

  root.innerHTML = `
    <div class="collab-wrap fx-wrap">
      <div class="content-wrap">
        <header class="collab-head">
          <h2 class="collab-title">협업 작가</h2>
          <p class="collab-desc">카드를 클릭하면 해당 작가님 페이지로 이동합니다.</p>
        </header>
        <div class="collab-grid" data-collab="grid"></div>
      </div>
    </div>
  `;

  const rows = await fetchSheetRows(GIDS.collab);

  const items = rows
    .filter((r) => {
      const a = (r.active ?? "").toString().trim();
      return a === "" || truthy(a);
    })
    .map((r) => ({
      order: parseOrder(r.order),
      name: (r.name ?? "").toString().trim(),
      url: (r.url ?? "").toString().trim(),
      benefit: (r.benefit ?? "").toString().trim(),
      thumb: (r.thumb ?? "").toString().trim(),
    }))
    .filter((it) => it.name && it.url)
    .sort((a, b) => (a.order || 999999) - (b.order || 999999) || a.name.localeCompare(b.name));

  renderCollab(items);
  applyFxToAllWraps();
}

function renderCollab(items) {
  const grid = document.querySelector('[data-collab="grid"]');
  if (!grid) return;

  if (!items.length) {
    grid.innerHTML = `<p class="collab-empty">등록된 협업 작가가 없습니다.</p>`;
    return;
  }

  grid.innerHTML = items
    .map((it) => {
      const safeUrl = sanitizeUrl(it.url);
      const benefitHtml = it.benefit ? `<p class="collab-benefit">${nl2br(escapeHtml(it.benefit))}</p>` : "";

      return `
        <a class="collab-card" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">
          ${renderCollabThumb(it.thumb, it.name)}
          <div class="collab-body">
            <div class="collab-name">${escapeHtml(withNim(it.name))}</div>
            ${benefitHtml}
          </div>
        </a>
      `;
    })
    .join("");
}

function withNim(name = "") {
  const t = name.trim();
  if (!t) return t;
  return t.endsWith("님") ? t : `${t}님`;
}

function renderCollabThumb(thumb, name) {
  const t = (thumb ?? "").toString().trim();
  if (t) {
    return `
      <div class="collab-thumb">
        <img src="${escapeHtml(t)}" alt="${escapeHtml(name)}" loading="lazy" />
      </div>
    `;
  }

  const initial = initialFromName(name);
  return `
    <div class="collab-thumb is-empty" aria-hidden="true">
      <span class="collab-thumb-text">${escapeHtml(initial)}</span>
    </div>
  `;
}

function initialFromName(name = "") {
  const t = name.trim();
  if (!t) return "•";
  return t[0].toUpperCase();
}

function parseOrder(v) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 999999;
}

function sanitizeUrl(url) {
  const u = (url ?? "").toString().trim();
  if (!u) return "#";
  // http/https만 허용 (외부 링크 안전)
  if (/^https?:\/\//i.test(u)) return u;
  return "https://" + u.replace(/^\/+/, "");
}



/**************************
        Hero FX
***************************/
function applyFxToAllWraps() {
  document.querySelectorAll(".fx-wrap").forEach((wrap) => applyFxToWrap(wrap));
}

function applyFxToWrap(wrap) {
  if (!wrap) return;

  wrap.querySelectorAll(":scope > .fx-stars, :scope > .fx-nebula").forEach((n) => n.remove());

  const cs = getComputedStyle(wrap);
  if (cs.position === "static") wrap.style.position = "relative";
  wrap.style.overflow = "hidden";

  const stars = document.createElement("div");
  stars.className = "fx-stars";
  wrap.appendChild(stars);

  const nebula = document.createElement("div");
  nebula.className = "fx-nebula";
  wrap.appendChild(nebula);

  const preset = { starCount: 88, sparkleCount: 10, nebulaCount: 5 };

  for (let i = 0; i < preset.starCount; i++) {
    const s = document.createElement("i");
    s.className = "star";
    const size = rand(3.8, 4.7);

    s.style.width = `${size}px`;
    s.style.height = `${size}px`;
    s.style.left = `${rand(0, 100)}%`;
    s.style.top = `${rand(0, 100)}%`;
    s.style.background = "#fff";
    s.style.boxShadow = "0 0 6px rgba(255,255,255,.9)";
    s.style.animationDuration = `${rand(3.6, 7.5)}s`;
    s.style.animationDelay = `${rand(0, 2.5)}s`;
    stars.appendChild(s);
  }

  for (let i = 0; i < preset.sparkleCount; i++) {
    const sp = document.createElement("i");
    sp.className = "sparkle";
    const size = rand(2.5, 5.2);
    sp.style.width = `${size}px`;
    sp.style.height = `${size}px`;
    sp.style.left = `${rand(0, 100)}%`;
    sp.style.top = `${rand(0, 100)}%`;
    sp.style.animationDuration = `${rand(4.2, 9.0)}s`;
    sp.style.animationDelay = `${rand(0, 3.0)}s`;
    stars.appendChild(sp);
  }

  for (let i = 0; i < preset.nebulaCount; i++) {
    const n = document.createElement("i");
    n.className = "nebula";
    const w = rand(70, 240);
    const h = rand(70, 240);
    n.style.width = `${w}px`;
    n.style.height = `${h}px`;
    n.style.left = `${rand(-10, 90)}%`;
    n.style.top = `${rand(-20, 85)}%`;

    const tint = Math.random();
    const bg =
      tint < 0.45
        ? "rgba(159,168,255,.30)"
        : tint < 0.75
        ? "rgba(207,227,255,.32)"
        : "rgba(255,194,227,.26)";
    n.style.background = bg;

    nebula.appendChild(n);
  }
}


function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/**************************
       Sample Renderer
***************************/
async function initSample() {
  const root = document.querySelector("#sample");
  if (!root) return;

  root.innerHTML = `
    <div class="sp-wrap">
      <div class="sp-content">
        <header class="sp-head">
          <h2 class="sp-title">리깅 작업 샘플</h2>
          <p class="sp-desc">카테고리별 리깅 샘플 GIF입니다.</p>
        </header>
        <div class="sp-groups" data-sp="groups"></div>
      </div>
    </div>
  `;

  const rows = await fetchSheetRows(GIDS.sample);

  const items = rows
    .filter((r) => {
      const a = (r.active ?? "").toString().trim();
      return a === "" || truthy(a);
    })
    .map((r) => {
      const rawUrl = (r.imageurl || r.image || r.url || "").trim();
      const finalUrl = toLh3Url(rawUrl);

      return {
        order: toInt(r.order),
        category: (r.category || "").trim(),
        desc: (r.desc || "").trim(),
        url: finalUrl,
        caption: (r.caption || "").trim(),

        ratio: (r.ratio || "").trim(),
        fit: (r.fit || "").trim(),
      };
    })
    .filter((x) => x.category && x.url);

  renderSample(items);
}

function renderSample(items) {
  const groupsWrap = document.querySelector('[data-sp="groups"]');
  if (!groupsWrap) return;

  if (!items.length) {
    groupsWrap.innerHTML = `<p class="muted" style="padding:6px 6px 0;">등록된 샘플이 없습니다.</p>`;
    return;
  }

  const map = new Map();
  for (const it of items) {
    if (!map.has(it.category)) map.set(it.category, []);
    map.get(it.category).push(it);
  }

  const cats = [...map.entries()]
    .map(([category, arr]) => {
      const minOrder = Math.min(...arr.map((x) => (x.order ? x.order : 999999)));
      const desc = arr.map((x) => x.desc).find((d) => d && d.trim()) || "";

      const ratio = arr.map((x) => x.ratio).find((v) => v && v.trim()) || "16/9";
      const fitRaw = arr.map((x) => x.fit).find((v) => v && v.trim()) || "contain";
      const fit = fitRaw.toString().trim().toLowerCase();
      const safeFit = fit === "cover" ? "cover" : "contain";

      arr.sort((a, b) => (a.order || 0) - (b.order || 0) || a.url.localeCompare(b.url));

      return {
        category,
        desc,
        minOrder: Number.isFinite(minOrder) ? minOrder : 0,
        ratio,
        fit: safeFit,
        arr,
      };
    })
    .sort((a, b) => (a.minOrder || 0) - (b.minOrder || 0) || a.category.localeCompare(b.category));

  groupsWrap.innerHTML = cats
    .map((g) => {
      const descHtml = g.desc ? `<p class="sp-cat-desc">${nl2br(escapeHtml(g.desc))}</p>` : "";

      const grid = g.arr
        .map((it) => {
          const cap = it.caption ? `<figcaption class="sp-cap">${escapeHtml(it.caption)}</figcaption>` : "";

          return `
            <figure class="sp-item">
              <div class="sp-media">
                <img class="sp-gif" src="${escapeHtml(it.url)}" alt="${escapeHtml(g.category)}" loading="lazy" />
              </div>
              ${cap}
            </figure>
          `;
        })
        .join("");

      return `
        <section class="sp-group" style="--sp-ar:${escapeHtml(g.ratio)}; --sp-fit:${escapeHtml(g.fit)};">
          <header class="sp-cat-head">
            <h3 class="sp-cat-title">${escapeHtml(g.category)}</h3>
          </header>
          ${descHtml}
          <div class="sp-grid">${grid}</div>
        </section>
      `;
    })
    .join("");

  applyFxToAllWraps();
}

/**************************
    Google Drive URL fix
***************************/
function toLh3Url(input) {
  const s = (input || "").trim();
  if (!s) return "";

  if (s.includes("lh3.googleusercontent.com/d/")) return s;

  let m = s.match(/drive\.google\.com\/file\/d\/([^\/\?]+)\//);
  if (m?.[1]) return `https://lh3.googleusercontent.com/d/${m[1]}`;

  m = s.match(/[?&]id=([^&]+)/);
  if (m?.[1]) return `https://lh3.googleusercontent.com/d/${m[1]}`;

  if (/^[a-zA-Z0-9_-]{10,}$/.test(s)) return `https://lh3.googleusercontent.com/d/${s}`;

  return s;
}


/**************************
        Price Renderer
***************************/
async function initPrice() {
  const root = document.querySelector("#price");
  if (!root) return;

  root.innerHTML = `
    <div class="pr-wrap fx-wrap">
      <div class="content-wrap">

        <section class="pr-panel pr-basic">
          <header class="pr-head">
            <h2 class="pr-title">리깅 기본 옵션</h2>
          </header>

          <div class="pr-basic-grid">
            <div class="pr-basic-cards" data-pr="basicCards"></div>

            <div class="pr-basic-list">
              <h3 class="pr-subtitle">리깅 옵션 목록</h3>
              <ul class="pr-list" data-pr="includedList"></ul>
            </div>
          </div>
        </section>

        <section class="pr-panel pr-extra">
          <header class="pr-head">
            <h2 class="pr-title">리깅 추가 옵션</h2>
          </header>
          <div class="pr-extra-groups" data-pr="extraGroups"></div>
        </section>

      </div>
    </div>
  `;

  const rows = await fetchSheetRows(GIDS.price);
  renderPrice(rows);
  applyFxToAllWraps();
}

function renderPrice(rows) {
  const basicWrap = document.querySelector('[data-pr="basicCards"]');
  const listWrap = document.querySelector('[data-pr="includedList"]');
  const extraWrap = document.querySelector('[data-pr="extraGroups"]');
  if (!basicWrap || !listWrap || !extraWrap) return;

  const norm = (s) => (s ?? "").toString().trim();

  const basics = rows
    .filter((r) => norm(r.group) === "basic")
    .map((r) => ({
      order: toInt(r.order),
      title: norm(r.title),
      price: toInt(r.price),
      desc: norm(r.desc),
      calc: norm(r.calc_type),
    }))
    .filter((x) => x.title)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const includes = rows
    .filter((r) => norm(r.group) === "list")
    .map((r) => ({
      order: toInt(r.order),
      title: norm(r.title),
    }))
    .filter((x) => x.title)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const extras = rows
    .filter((r) => norm(r.group) === "extra")
    .map((r) => ({
      order: toInt(r.order),
      category: norm(r.category) || "기타",
      title: norm(r.title),
      price: toInt(r.price),
      desc: norm(r.desc),
      calc: norm(r.calc_type),
    }))
    .filter((x) => x.title)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // ---------- basic cards ----------
  if (!basics.length) {
    basicWrap.innerHTML = `<p class="muted" style="padding:6px;">기본 옵션이 없습니다.</p>`;
  } else {
    basicWrap.innerHTML = basics
      .map((it) => {
        const priceText = formatWon(it.price);
        const descHtml = it.desc ? renderMultilineParagraphs(it.desc, "pr-desc") : "";
        const tag = it.calc ? `<span class="pr-pill">${escapeHtml(it.calc)}</span>` : "";

        return `
          <article class="pr-card">
            <div class="pr-card-top">
              <h3 class="pr-card-title">${escapeHtml(it.title)}</h3>
              <div class="pr-card-meta">
                <span class="pr-price">${escapeHtml(priceText)}</span>
                ${tag}
              </div>
            </div>
            ${descHtml}
          </article>
        `;
      })
      .join("");
  }

  // ---------- included list ----------
  if (!includes.length) {
    listWrap.innerHTML = `<li class="muted">포함 옵션이 없습니다.</li>`;
  } else {
    listWrap.innerHTML = includes
      .map((it) => `<li class="pr-li">${escapeHtml(it.title)}</li>`)
      .join("");
  }

  // ---------- extra grouped by category ----------
  if (!extras.length) {
    extraWrap.innerHTML = `<p class="muted" style="padding:6px;">추가 옵션이 없습니다.</p>`;
  } else {
    const map = new Map();
    for (const it of extras) {
      if (!map.has(it.category)) map.set(it.category, []);
      map.get(it.category).push(it);
    }

    const categories = [...map.entries()];

    extraWrap.innerHTML = categories
      .map(([cat, items]) => {
        const cards = items
          .map((it) => {
            const priceText = formatWon(it.price);
            const tag = it.calc ? `<span class="pr-pill">${escapeHtml(it.calc)}</span>` : "";
            const descHtml = it.desc ? `<div class="pr-mini-desc">${nl2br(escapeHtml(it.desc))}</div>` : "";

            return `
              <div class="pr-mini">
                <div class="pr-mini-top">
                  <div class="pr-mini-title">${escapeHtml(it.title)}</div>
                  <div class="pr-mini-meta">
                    <span class="pr-mini-price">${escapeHtml(priceText)}</span>
                    ${tag}
                  </div>
                </div>
                ${descHtml}
              </div>
            `;
          })
          .join("");

        return `
          <section class="pr-group">
            <h3 class="pr-group-title">${escapeHtml(cat)}</h3>
            <div class="pr-mini-grid">
              ${cards}
            </div>
          </section>
        `;
      })
      .join("");
  }
}

function formatWon(n) {
  const v = Number.isFinite(n) ? n : toInt(n);
  if (!v) return "0원";
  try {
    return v.toLocaleString("ko-KR") + "원";
  } catch {
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원";
  }
}

function renderMultilineParagraphs(text, cls) {
  const lines = (text || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (!lines.length) return "";
  return `<div class="${escapeHtml(cls)}">` + lines.map((l) => `<p>${escapeHtml(l)}</p>`).join("") + `</div>`;
}




/**************************
        Notice Renderer
***************************/
async function initNotice() {
  const root = document.querySelector("#notice");
  if (!root) return;

  root.innerHTML = `
    <div class="nt-wrap fx-wrap">
      <div class="content-wrap">

        <!-- 시트 데이터 카드 -->
        <section class="nt-panel">
          <header class="nt-head">
            <h2 class="nt-title">공지사항</h2>
            <p class="nt-desc">의뢰 전 아래 내용을 꼭 확인해주세요.</p>
          </header>

          <div class="nt-groups" data-nt="groups"></div>
        </section>

        <!-- 작업 과정 (고정 HTML) -->
        <section class="nt-panel nt-process">
          <header class="nt-head">
            <h2 class="nt-title">작업 과정</h2>
          </header>

          <ul class="nt-process-note" data-nt="processNote"></ul>

          <ol class="nt-steps">
            <li><b>문의</b> · 문의 양식 제출</li>
            <li><b>안내 및 입금</b> · 견적 안내 및 입금 진행</li>
            <li><b>얼굴 리깅</b> · 눈 / 입 / 표정</li>
            <li><b>머리 리깅</b> · 머리 XYZ + 머리/머리카락 물리 연산</li>
            <li><b>1차 컨펌</b> · 수정 사항 반영</li>
            <li><b>몸 리깅</b> · 몸 XYZ + 몸/의상 물리 연산</li>
            <li><b>2차 컨펌</b> · 수정 사항 반영</li>
            <li><b>작업 완성</b> · 작업 전달 및 세팅 안내</li>
          </ol>
        </section>

      </div>
    </div>
  `;

  const rows = await fetchSheetRows(GIDS.notice);
  renderNotice(rows);
  applyFxToAllWraps();
}

function renderNotice(rows) {
  const wrap = document.querySelector('[data-nt="groups"]');
  const processNoteEl = document.querySelector('[data-nt="processNote"]');
  if (!wrap) return;

  if (!rows.length) {
    wrap.innerHTML = `<p class="muted">등록된 공지사항이 없습니다.</p>`;
    if (processNoteEl) processNoteEl.style.display = "none";
    return;
  }

  const processGroupName = "작업 과정";

  const map = new Map();
  rows.forEach((r) => {
    const group = (r.group || "").trim();
    if (!group) return;

    if (!map.has(group)) map.set(group, []);
    map.get(group).push({
      order: toInt(r.order),
      content: (r.content || "").trim(),
    });
  });

  const processItems = (map.get(processGroupName) || [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter((it) => it.content);

  if (processNoteEl) {
    if (!processItems.length) {
      processNoteEl.style.display = "none";
    } else {
      processNoteEl.style.display = "";
      processNoteEl.innerHTML = processItems
        .map((it) => `<li>${escapeHtml(it.content)}</li>`)
        .join("");
    }
  }

  const groups = [...map.entries()]
    .filter(([groupName]) => groupName !== processGroupName)
    .map(([groupName, items]) => {
      const sorted = items.slice().sort((a, b) => a.order - b.order);
      const minOrder = Math.min(...sorted.map((x) => x.order || 0));
      return { groupName, items: sorted, minOrder };
    })
    .sort((a, b) => (a.minOrder || 0) - (b.minOrder || 0));

  wrap.innerHTML = groups
    .map((g, idx) => {
      const id = `nt-acc-${idx}`;
      const list = g.items
        .filter((it) => it.content)
        .map((it) => `<li>${escapeHtml(it.content)}</li>`)
        .join("");

      const open = false;

      return `
        <article class="nt-acc" data-acc>
          <button class="nt-acc-btn"
                  type="button"
                  data-acc-btn
                  aria-expanded="${open ? "true" : "false"}"
                  aria-controls="${id}">
            <h3 class="nt-acc-title">${escapeHtml(g.groupName)}</h3>
            <span class="nt-acc-ico" aria-hidden="true">▼</span>
          </button>

          <div class="nt-acc-body"
               id="${id}"
               data-acc-body
               aria-hidden="${open ? "false" : "true"}">
            <div class="nt-acc-inner">
              <ul class="nt-acc-list">
                ${list}
              </ul>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  initNoticeAccordions(wrap);
}

function initNoticeAccordions(container) {
  if (!container) return;

  container.querySelectorAll("[data-acc]").forEach((acc) => {
    const btn = acc.querySelector("[data-acc-btn]");
    const body = acc.querySelector("[data-acc-body]");
    if (!btn || !body) return;

    if (btn.getAttribute("aria-expanded") === "true") {
      setAccordionOpen(body, true, false);
    } else {
      setAccordionOpen(body, false, false);
    }
  });

  container.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-acc-btn]");
    if (!btn || !container.contains(btn)) return;

    const acc = btn.closest("[data-acc]");
    const body = acc?.querySelector("[data-acc-body]");
    if (!acc || !body) return;

    const isOpen = btn.getAttribute("aria-expanded") === "true";

    btn.setAttribute("aria-expanded", String(!isOpen));
    body.setAttribute("aria-hidden", String(isOpen));

    setAccordionOpen(body, !isOpen, true);
  });

  window.addEventListener(
    "resize",
    debounce(() => {
      container.querySelectorAll("[data-acc]").forEach((acc) => {
        const btn = acc.querySelector("[data-acc-btn]");
        const body = acc.querySelector("[data-acc-body]");
        if (!btn || !body) return;
        if (btn.getAttribute("aria-expanded") === "true") {
          setAccordionOpen(body, true, false);
        }
      });
    }, 120)
  );
}

function closeOtherAccordions(container, exceptAcc) {
  container.querySelectorAll("[data-acc]").forEach((acc) => {
    if (acc === exceptAcc) return;
    const btn = acc.querySelector("[data-acc-btn]");
    const body = acc.querySelector("[data-acc-body]");
    if (!btn || !body) return;
    if (btn.getAttribute("aria-expanded") === "true") {
      btn.setAttribute("aria-expanded", "false");
      body.setAttribute("aria-hidden", "true");
      setAccordionOpen(body, false, true);
    }
  });
}

/**
 * open/close with height animation
**/
function setAccordionOpen(bodyEl, open, animate = true) {
  const inner = bodyEl.querySelector(".nt-acc-inner");
  if (!inner) return;
  if (!animate) bodyEl.style.transition = "none";

  const current = bodyEl.getBoundingClientRect().height;
  const target = inner.scrollHeight;

  if (open) {
    bodyEl.style.height = current + "px";

    bodyEl.offsetHeight;

    if (animate) bodyEl.style.transition = "";
    bodyEl.style.height = target + "px";

    const onEnd = (e) => {
      if (e.propertyName !== "height") return;
      bodyEl.style.height = "auto";
      bodyEl.removeEventListener("transitionend", onEnd);
    };
    bodyEl.addEventListener("transitionend", onEnd);

  } else {
    bodyEl.style.height = current + "px";
    bodyEl.offsetHeight;

    if (animate) bodyEl.style.transition = "";
    bodyEl.style.height = "0px";
  }

  if (!animate) {
    bodyEl.offsetHeight;
    bodyEl.style.transition = "";
    if (open) bodyEl.style.height = "auto";
  }
}





/**************************
   Unified Form (price-driven)
   - basic(리깅 옵션) 상단으로 이동 + 2칸(span 2)
   - extra(추가 옵션) 아래 섹션 유지
***************************/
async function initForm() {
  const root = document.querySelector("#form");
  if (!root) return;

  root.innerHTML = `
    <div class="fm-wrap fx-wrap">
      <div class="content-wrap">

        <section class="fm-panel">
          <header class="fm-head">
            <h2 class="fm-title">리깅 신청 양식</h2>
            <p class="fm-desc">옵션/금액은 변동될 수 있으며, 아래 예상 견적은 참고용입니다.</p>
          </header>

          <form class="fm-all" data-fm="form" autocomplete="off">
            <div class="fm-top" data-fm="top"></div>

            <!-- 추가 옵션(카테고리별) -->
            <div class="fm-price" data-fm="price"></div>

            <div class="fm-bottom" data-fm="bottom"></div>

            <div class="fm-est" data-fm="est">
              <div class="fm-est-head">
                <span class="fm-est-title">예상 견적</span>
                <span class="fm-est-total" data-fm="totalText">0원</span>
              </div>
              <div class="fm-est-desc" data-fm="breakdown"></div>

              <div class="fm-est-actions">
                <button type="button" class="fm-btn" data-fm="copy">양식 복사</button>
                <button type="button" class="fm-btn" data-fm="reset">초기화</button>
              </div>
            </div>
          </form>
        </section>

      </div>
    </div>
  `;

  const [formRows, priceRows] = await Promise.all([
    fetchSheetRows(GIDS.form),
    fetchSheetRows(GIDS.price),
  ]);

  renderPlainFormFields(formRows);       // 상단/하단 입력 필드
  renderPriceDrivenOptions(priceRows);   // 리깅옵션(상단 baseSlot) + 추가옵션(아래)
  wireEstimateSystem();                  // 합산/복사/초기화

  applyFxToAllWraps();
}

/***************
  (A) 입력 필드 렌더 (form 시트)
  - 상단: text/select/radio/date 중심
  - 하단: textarea 중심(전체폭)
  - 상단 끝에 baseSlot(리깅 옵션) 자리 자동 추가
****************/
function renderPlainFormFields(rows) {
  const top = document.querySelector('[data-fm="top"]');
  const bottom = document.querySelector('[data-fm="bottom"]');
  if (!top || !bottom) return;

  const items = rows
    .map((r) => ({
      order: toInt(r.order),
      key: (r.key || "").trim(),
      label: (r.label || "").trim(),
      type: (r.type || "text").trim().toLowerCase(),
      options: (r.options || "").trim(),
      placeholder: (r.placeholder || "").trim(),
    }))
    .filter((x) => x.key && x.label)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const topHtml = [];
  const bottomHtml = [];

  for (const it of items) {
    const html = buildPlainField(it);
    if (it.type === "textarea") bottomHtml.push(html);
    else topHtml.push(html);
  }

  // ✅ 중요한 부분: baseSlot을 top에 "항상" 붙여둔다 (여기서 2칸 span 처리)
  top.innerHTML =
    topHtml.join("") +
    `<div class="fm-top-slot" data-fm="baseSlot"></div>`;

  bottom.innerHTML = bottomHtml.join("");
}

function buildPlainField(it) {
  const key = escapeHtml(it.key);
  const label = escapeHtml(it.label);
  const ph = escapeHtml(it.placeholder || "");
  const type = (it.type || "text").toLowerCase();

  const head = `<div class="fm-item"><label class="fm-label" for="fm-${key}">${label}</label>`;
  const tail = `</div>`;

  if (type === "textarea") {
    return head + `<textarea class="fm-control" id="fm-${key}" name="${key}" placeholder="${ph}"></textarea>` + tail;
  }

  if (type === "select") {
    const opts = it.options.split(",").map(s => s.trim()).filter(Boolean);
    const optHtml = opts.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("");
    return head + `<select class="fm-control" id="fm-${key}" name="${key}">${optHtml}</select>` + tail;
  }

  if (type === "radio") {
    const opts = it.options.split(",").map(s => s.trim()).filter(Boolean);
    const radios = opts.map((o, idx) => {
      const id = `fm-${key}-${idx}`;
      const v = escapeHtml(o);
      return `
        <label class="fm-choice" for="${id}">
          <input id="${id}" type="radio" name="${key}" value="${v}">
          <span>${v}</span>
        </label>
      `;
    }).join("");
    return head + `<div class="fm-choices" id="fm-${key}">${radios}</div>` + tail;
  }

  const inputType = type === "date" ? "date" : "text";
  return head + `<input class="fm-control" id="fm-${key}" name="${key}" type="${inputType}" placeholder="${ph}">` + tail;
}

/***************
  (B) 옵션 + 견적 UI 렌더 (price 시트만 사용)
  - group=basic  -> baseSlot에 "리깅 옵션" 택1 라디오로 렌더
  - group=extra  -> 아래 "추가 옵션" 1번 헤더 + category 별 섹션
****************/
function renderPriceDrivenOptions(priceRows) {
  const wrap = document.querySelector('[data-fm="price"]');
  const baseSlot = document.querySelector('[data-fm="baseSlot"]');
  if (!wrap) return;

  const norm = (s) => (s ?? "").toString().trim();

  // basic -> 택1
  const basics = priceRows
    .filter(r => norm(r.group) === "basic")
    .map(r => ({
      order: toInt(r.order),
      title: norm(r.title),
      price: toInt(r.price),
      desc: norm(r.desc),
    }))
    .filter(x => x.title && x.price > 0)
    .sort((a,b) => (a.order||0)-(b.order||0));

  const baseHtml = basics.length ? `
    <section class="fm-block fm-block--base">
      <h3 class="fm-block-title">리깅 옵션</h3>
      <div class="fm-base">
        ${basics.map((it, idx) => {
          const id = `est-base-${idx}`;
          return `
            <label class="fm-opt" for="${id}">
              <input id="${id}" type="radio" name="est_base"
                data-est="base" data-title="${escapeHtml(it.title)}" data-price="${it.price}">
              <span class="fm-opt-name">${escapeHtml(it.title)}</span>
              <span class="fm-opt-price">${escapeHtml(formatWon(it.price))}</span>
            </label>
          `;
        }).join("")}
      </div>
    </section>
  ` : "";

  // ✅ baseHtml은 상단 baseSlot에 넣기
  if (baseSlot) baseSlot.innerHTML = baseHtml;

  // extra -> category + calc_type
  const extras = priceRows
    .filter(r => norm(r.group) === "extra")
    .map(r => ({
      order: toInt(r.order),
      category: norm(r.category) || "기타",
      title: norm(r.title),
      price: toInt(r.price),
      desc: norm(r.desc),
      calc: norm(r.calc_type).toLowerCase(), // add / unit
    }))
    .filter(x => x.title && x.price > 0)
    .sort((a,b) => (a.order||0)-(b.order||0));

  if (!extras.length) {
    wrap.innerHTML = "";
    return;
  }

  // category별 그룹핑
  const byCat = new Map();
  for (const it of extras) {
    if (!byCat.has(it.category)) byCat.set(it.category, []);
    byCat.get(it.category).push(it);
  }

  // 카테고리 정렬: 각 카테고리 내 최소 order 기준
  const catList = [...byCat.entries()]
    .map(([cat, arr]) => {
      const minOrder = Math.min(...arr.map((x) => (x.order ? x.order : 999999)));
      return { cat, minOrder, arr };
    })
    .sort((a, b) => (a.minOrder || 0) - (b.minOrder || 0) || a.cat.localeCompare(b.cat));

  const catBlocksHtml = catList.map(({ cat, arr }) => {
    const units = arr.filter(x => x.calc === "unit");
    const adds  = arr.filter(x => x.calc === "add");

    const unitHtml = units.length ? `
      <div class="fm-sub">
        <div class="fm-sub-title">${escapeHtml(cat)}</div>
        <div class="fm-unit-row">
          ${units.map((it, idx) => {
            const id = `est-unit-${escapeHtml(cat)}-${idx}`;
            return `
              <div class="fm-unit">
                <label class="fm-unit-label" for="${id}">
                  ${escapeHtml(it.title)}
                  <span class="fm-unit-price">개당 ${escapeHtml(formatWon(it.price))}</span>
                </label>
                <select id="${id}" class="fm-control fm-unit-select"
                  data-est="unit" data-title="${escapeHtml(it.title)}" data-unitprice="${it.price}">
                  ${[...Array(11)].map((_,n)=>`<option value="${n}">${n}개</option>`).join("")}
                </select>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    ` : "";

    const addHtml = adds.length ? `
      <div class="fm-sub">
        <div class="fm-sub-title">${escapeHtml(cat)}</div>
        <div class="fm-check-grid">
          ${adds.map((it, idx) => {
            const id = `est-add-${escapeHtml(cat)}-${idx}`;
            return `
              <label class="fm-opt" for="${id}">
                <input id="${id}" type="checkbox"
                  data-est="add" data-title="${escapeHtml(it.title)}" data-price="${it.price}">
                <span class="fm-opt-name">${escapeHtml(it.title)}</span>
                <span class="fm-opt-price">+ ${escapeHtml(formatWon(it.price))}</span>
              </label>
            `;
          }).join("")}
        </div>
      </div>
    ` : "";

    return unitHtml + addHtml;
  }).join("");

  // ✅ “추가 옵션” 헤더는 딱 한 번만
  const extraHtml = `
    <section class="fm-block fm-block--extra">
      <h3 class="fm-block-title">추가 옵션</h3>
      ${catBlocksHtml}
    </section>
  `;

  wrap.innerHTML = extraHtml;
}

/***************
  (C) 합산/브레이크다운/복사/초기화
****************/
function wireEstimateSystem() {
  const form = document.querySelector('[data-fm="form"]');
  const copyBtn = document.querySelector('[data-fm="copy"]');
  const resetBtn = document.querySelector('[data-fm="reset"]');
  if (!form) return;

  const recalc = () => {
    let total = 0;
    const lines = [];

    const base = document.querySelector('input[name="est_base"]:checked');
    if (base) {
      const p = toInt(base.dataset.price);
      total += p;
      lines.push(`${base.dataset.title} (${formatWon(p)})`);
    }

    document.querySelectorAll('input[type="checkbox"][data-est="add"]:checked').forEach(cb => {
      const p = toInt(cb.dataset.price);
      total += p;
      lines.push(`${cb.dataset.title} (${formatWon(p)})`);
    });

    document.querySelectorAll('select[data-est="unit"]').forEach(sel => {
      const n = toInt(sel.value);
      if (!n) return;
      const up = toInt(sel.dataset.unitprice);
      const p = n * up;
      total += p;
      lines.push(`${sel.dataset.title} x${n} (${formatWon(p)})`);
    });

    const totalText = document.querySelector('[data-fm="totalText"]');
    const breakdown = document.querySelector('[data-fm="breakdown"]');

    if (totalText) totalText.textContent = formatWon(total);

    if (breakdown) {
      // ✅ inline 한 줄 표기 ( + 로 연결 )
      breakdown.textContent = lines.length
        ? lines.join(" + ")
        : "선택된 옵션이 없습니다.";

      breakdown.classList.toggle("muted", !lines.length);
    }
  };

  form.addEventListener("change", (e) => {
    const t = e.target;
    if (!t) return;
    if (
      t.matches('input[name="est_base"]') ||
      t.matches('input[data-est="add"]') ||
      t.matches('select[data-est="unit"]')
    ) recalc();
  });

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const txt = buildCopyText();
      try {
        await navigator.clipboard.writeText(txt);
        copyBtn.textContent = "복사 완료!";
        setTimeout(() => (copyBtn.textContent = "양식 복사"), 1200);
      } catch {
        alert(txt);
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      form.reset();
      document.querySelectorAll('select[data-est="unit"]').forEach(sel => sel.value = "0");
      recalc();
    });
  }

  function buildCopyText() {
    const labelMap = {
      nickname: "닉네임",
      platform: "플랫폼",
      tracking: "트래킹 장비",
      deadline: "마감일",
      illustrator: "일러스트레이터",
      sns: "작업 과정 공개",
      collab: "협업 작가 유무",
      face_list: "표정 종류",
      extra: "추가 요청 사항"
    };

    const fd = new FormData(form);

    const rows = [];
    rows.push("📩 리깅 신청서");
    rows.push("━━━━━━━━━━━━━━━━");

    // 기본 입력 항목
    for (const [k, v] of fd.entries()) {
      const vv = (v ?? "").toString().trim();
      if (!vv) continue;

    const label = labelMap[k] || k;
    rows.push(`- ${label}: ${vv}`);
    }

    // 견적
    const total = document.querySelector('[data-fm="totalText"]')?.textContent || "0원";

    const picked = [];
    const base = document.querySelector('input[name="est_base"]:checked');
    if (base) picked.push(base.dataset.title);

    document.querySelectorAll('input[type="checkbox"][data-est="add"]:checked')
      .forEach(cb => picked.push(cb.dataset.title));

    document.querySelectorAll('select[data-est="unit"]')
      .forEach(sel => {
        const n = toInt(sel.value);
        if (n) picked.push(`${sel.dataset.title} x${n}`);
      });

    rows.push("");
    rows.push("💰 예상 견적");
    rows.push(`- 총 금액: ${total}`);

    if (picked.length) {
      rows.push(`- 선택 옵션: ${picked.join(" + ")}`);
    }

    return rows.join("\n");
  }


  recalc();
}

function formatWon(n) {
  const v = Number(n || 0);
  return v.toLocaleString("ko-KR") + "원";
}

(function () {
  function bindGoto() {
    document.querySelectorAll('a[name="goto"]').forEach(a => {
      if (a.__gotoBound) return;
      a.__gotoBound = true;

      a.addEventListener("click", e => {
        e.preventDefault();

        const targetId = a.getAttribute("href");
        if (!targetId) return;

        const target =
          document.getElementById(targetId) ||
          document.querySelector(`[name="${targetId}"]`);

        if (!target) {
          console.warn("[goto] target not found:", targetId);
          return;
        }

        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest"
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", bindGoto);

  window.addEventListener("load", bindGoto);

  setTimeout(bindGoto, 800);
})();