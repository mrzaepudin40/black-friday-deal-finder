// HTML for the list page and the deal page. Every value from the data is escaped
// before it goes into the page, and every deal card shows the same facts: product,
// store, sale price, usual price, discount, saving, verdict, check time, source,
// and the link to the store.

import { CHECKED_LABEL, VERDICTS, deals } from "./data.js";
import { percentOff, saving } from "./filters.js";

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const usd = (n) =>
  `$${Number(n).toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

const monogram = (d) =>
  d.category
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function verdictBadge(d) {
  const v = VERDICTS[d.verdict];
  return `<span class="verdict verdict-${d.verdict}" title="${escape(v.blurb)}">${v.label}</span>`;
}

export function dealCard(d) {
  return `<article class="card">
  <div class="tile tile-${d.verdict}" aria-hidden="true">${monogram(d)}</div>
  <div class="card-body">
    <div class="card-top">${verdictBadge(d)}<span class="pct">−${percentOff(d)}%</span></div>
    <h3><a href="#/deal/${encodeURIComponent(d.id)}">${escape(d.title)}</a></h3>
    <p class="meta"><span class="store">${escape(d.store)}</span> · ${escape(d.category)}</p>
    <p class="price"><strong>${usd(d.price)}</strong> <s>${usd(d.was)}</s>
      <span class="save">save ${usd(saving(d))}</span></p>
    <p class="evidence">${escape(d.evidence)}</p>
    <p class="checked">Checked ${escape(CHECKED_LABEL)} · ${escape(d.source)}</p>
    <p class="cta"><a class="store-link" href="${escape(d.url)}" target="_blank" rel="noopener">View at ${escape(d.store)} ↗</a></p>
  </div>
</article>`;
}

export function listPage({ state, shown, total, categories, stores }) {
  const chips = ["All", ...categories]
    .map(
      (c) =>
        `<button type="button" class="chip${state.cat === c ? " active" : ""}" data-cat="${escape(c)}" aria-pressed="${state.cat === c}">${escape(c)}</button>`,
    )
    .join("");
  const storeOptions = ["All", ...stores]
    .map(
      (s) =>
        `<option value="${escape(s)}"${state.store === s ? " selected" : ""}>${escape(s)}</option>`,
    )
    .join("");
  const minOptions = [0, 20, 30, 40, 50]
    .map(
      (m) =>
        `<option value="${m}"${state.min === m ? " selected" : ""}>${m === 0 ? "Any discount" : `${m}% off or more`}</option>`,
    )
    .join("");
  const sortOptions = [
    ["discount", "Biggest discount"],
    ["saving", "Biggest saving ($)"],
    ["price", "Lowest price"],
    ["newest", "Newest checked"],
  ]
    .map(
      ([v, label]) =>
        `<option value="${v}"${state.sort === v ? " selected" : ""}>${label}</option>`,
    )
    .join("");
  const cards = shown.map(dealCard).join("\n");
  const empty =
    shown.length === 0
      ? `<p class="empty">No deals match those filters. <a href="#/">Clear the filters</a> to see all ${total} deals.</p>`
      : "";
  const best = shown[0];
  const topPick = best
    ? `<section class="top-pick" aria-label="Top pick">
      <p class="top-pick-kicker">★ TOP PICK — biggest discount right now</p>
      <p class="top-pick-line"><a href="#/deal/${encodeURIComponent(best.id)}">${escape(best.title)}</a>
      · ${escape(best.store)} · <strong>${usd(best.price)}</strong> <s>${usd(best.was)}</s>
      · −${percentOff(best)}% · save ${usd(saving(best))} ${verdictBadge(best)}</p>
    </section>`
    : "";
  return `
  <section class="controls" aria-label="Search and filter deals">
    <div class="search-row">
      <label class="search-label">Search deals
        <input id="search" type="search" placeholder="Try “headphones”, “Dyson”, “LEGO”…" value="${escape(state.q)}" autocomplete="off">
      </label>
      <label>Store
        <select id="store">${storeOptions}</select>
      </label>
      <label>Discount
        <select id="min">${minOptions}</select>
      </label>
      <label>Sort by
        <select id="sort">${sortOptions}</select>
      </label>
    </div>
    <div class="chips" role="group" aria-label="Category">${chips}</div>
    <p class="count" aria-live="polite"><strong>${shown.length}</strong> of ${total} verified deals · sorted by ${escape(state.sort === "discount" ? "biggest discount" : state.sort === "saving" ? "biggest saving" : state.sort === "price" ? "lowest price" : "newest checked")}</p>
  </section>
  ${topPick}
  <section class="grid" aria-label="Deals">${cards}</section>
  ${empty}`;
}

export function dealPage(d, others) {
  const compare =
    others.length > 0
      ? `<section class="compare">
        <h2>Same product at other stores</h2>
        <ul>${others
          .map(
            (o) =>
              `<li><a href="#/deal/${encodeURIComponent(o.id)}">${escape(o.store)}</a> — <strong>${usd(o.price)}</strong> <s>${usd(o.was)}</s> (−${percentOff(o)}%) ${verdictBadge(o)}</li>`,
          )
          .join("")}</ul>
        <p class="fine">Prices were each checked at their own store on ${escape(CHECKED_LABEL)}. The cheapest in-stock listing wins.</p>
      </section>`
      : "";
  return `
  <p class="back"><a href="#/">← All ${deals.length} deals</a></p>
  <article class="detail">
    <div class="detail-head">
      <div class="tile tile-${d.verdict} tile-big" aria-hidden="true">${monogram(d)}</div>
      <div>
        ${verdictBadge(d)}
        <h1>${escape(d.title)}</h1>
        <p class="meta"><span class="store">${escape(d.store)}</span> · ${escape(d.category)}</p>
      </div>
    </div>
    <dl class="facts">
      <div><dt>Sale price</dt><dd class="big-price">${usd(d.price)}</dd></div>
      <div><dt>Usual price</dt><dd><s>${usd(d.was)}</s></dd></div>
      <div><dt>Discount</dt><dd>−${percentOff(d)}% · save ${usd(saving(d))}</dd></div>
      <div><dt>Store</dt><dd>${escape(d.store)}</dd></div>
      <div><dt>Checked</dt><dd>${escape(CHECKED_LABEL)}</dd></div>
      <div><dt>Price read in</dt><dd>${escape(d.source)}</dd></div>
    </dl>
    <section class="verdict-box verdict-box-${d.verdict}">
      <h2>Is it really a deal? ${VERDICTS[d.verdict].label}</h2>
      <p>${escape(d.evidence)}</p>
      <p class="fine">How we judge: NEW LOW only when a source says so in words; STRONG DEAL is 30%+ off; SOLID DEAL is 20–29% off; ORDINARY SALE is under 20% off. A big percentage off an inflated list price is still flagged here.</p>
    </section>
    ${compare}
    <section class="buy">
      <h2>Before you buy</h2>
      <ul>
        <li>Open the store link and check the price is still ${usd(d.price)} — prices move fast on Black Friday.</li>
        <li>Check delivery dates, returns, and whether the deal needs a membership, code, or trade-in.</li>
        <li>Compare the same product at the other stores listed above — the cheapest listing wins.</li>
      </ul>
      <p><a class="store-link big-cta" href="${escape(d.url)}" target="_blank" rel="noopener">View at ${escape(d.store)} ↗</a></p>
    </section>
  </article>`;
}

export function missingPage() {
  return `<h1>Deal not found</h1><p>There is no deal at this address. <a href="#/">See all ${deals.length} deals</a>.</p>`;
}
