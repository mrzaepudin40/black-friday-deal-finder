// FridayLens — a Black Friday deal finder. Hash routes, no network requests:
//   #/                     the deal list, filters carried in the hash query
//   #/?q=dyson&cat=Audio   the list, pre-filtered (used by the screenshots)
//   #/deal/<id>            one deal, with its verdict and store comparison
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { CATEGORIES, CHECKED_LABEL, STORES, deals } from "./data.js";
import {
  DEFAULT_STATE,
  applyFilters,
  applySort,
  hashForState,
  stateFromHash,
} from "./filters.js";
import { dealPage, listPage, missingPage } from "./views.js";

const app = document.getElementById("app");
const countEl = document.getElementById("deal-count");

function renderList() {
  const state = stateFromHash(location.hash);
  const shown = applySort(applyFilters(deals, state), state.sort);
  app.innerHTML = listPage({
    state,
    shown,
    total: deals.length,
    categories: CATEGORIES,
    stores: STORES,
  });
  document.title = `FridayLens — ${deals.length} verified Black Friday deals`;

  const search = app.querySelector("#search");
  const store = app.querySelector("#store");
  const min = app.querySelector("#min");
  const sort = app.querySelector("#sort");

  const push = (next) => {
    const target = hashForState({ ...state, ...next });
    if (target !== location.hash) history.replaceState(null, "", target);
    render();
  };
  let timer = null;
  search.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => push({ q: search.value }), 250);
  });
  store.addEventListener("change", () => push({ store: store.value }));
  min.addEventListener("change", () => push({ min: Number(min.value) }));
  sort.addEventListener("change", () => push({ sort: sort.value }));
  app.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => push({ cat: chip.dataset.cat }));
  });
}

function renderDeal(id) {
  const found = deals.find((d) => d.id === decodeURIComponent(id));
  if (!found) {
    document.title = "Deal not found | FridayLens";
    app.innerHTML = missingPage();
    return;
  }
  const others = deals.filter((d) => d.group === found.group && d.id !== found.id);
  document.title = `${found.title} — ${found.store} | FridayLens`;
  app.innerHTML = dealPage(found, others);
}

function render() {
  window.__shotReady = false;
  const match = location.hash.match(/^#\/deal\/([^/?]+)/);
  if (match) renderDeal(match[1]);
  else renderList();
  if (countEl) countEl.textContent = `${deals.length} verified deals`;
  const checkedEl = document.getElementById("checked-at");
  if (checkedEl) checkedEl.textContent = CHECKED_LABEL;
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

window.addEventListener("hashchange", render);
render();
