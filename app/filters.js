// Filtering and sorting for the deal finder. Pure functions over the deal list,
// so the list page and the screenshot states all run the same code.

export const percentOff = (d) => Math.round((1 - d.price / d.was) * 100);
export const saving = (d) => Math.round((d.was - d.price) * 100) / 100;

export const DEFAULT_STATE = {
  q: "",
  cat: "All",
  store: "All",
  min: 0,
  sort: "discount",
};

/** Read the list state from the hash, e.g. #/?q=dyson&cat=Audio&min=30&sort=saving */
export function stateFromHash(hash) {
  const state = { ...DEFAULT_STATE };
  const query = (hash || "").split("?")[1];
  if (!query) return state;
  for (const pair of query.split("&")) {
    const [key, value] = pair.split("=");
    if (!key || value === undefined) continue;
    const v = decodeURIComponent(value.replace(/\+/g, " "));
    if (key === "q") state.q = v;
    if (key === "cat") state.cat = v;
    if (key === "store") state.store = v;
    if (key === "min") state.min = Number(v) || 0;
    if (key === "sort") state.sort = v;
  }
  return state;
}

/** Write the list state back into the hash (without a page reload). */
export function hashForState(state) {
  const parts = [];
  if (state.q) parts.push(`q=${encodeURIComponent(state.q)}`);
  if (state.cat !== "All") parts.push(`cat=${encodeURIComponent(state.cat)}`);
  if (state.store !== "All") parts.push(`store=${encodeURIComponent(state.store)}`);
  if (state.min > 0) parts.push(`min=${state.min}`);
  if (state.sort !== "discount") parts.push(`sort=${state.sort}`);
  return parts.length ? `#/?${parts.join("&")}` : "#/";
}

export function applyFilters(all, state) {
  const q = state.q.trim().toLowerCase();
  return all.filter((d) => {
    if (state.cat !== "All" && d.category !== state.cat) return false;
    if (state.store !== "All" && d.store !== state.store) return false;
    if (percentOff(d) < state.min) return false;
    if (q) {
      const hay = `${d.title} ${d.store} ${d.category} ${d.verdict}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

const SORTERS = {
  discount: (a, b) => percentOff(b) - percentOff(a) || saving(b) - saving(a),
  saving: (a, b) => saving(b) - saving(a) || percentOff(b) - percentOff(a),
  price: (a, b) => a.price - b.price,
  newest: (a, b) => b.checked.localeCompare(a.checked) || percentOff(b) - percentOff(a),
};

export function applySort(shown, sort) {
  const fn = SORTERS[sort] || SORTERS.discount;
  return [...shown].sort(fn);
}

export function verdictRank(d) {
  return { "new-low": 0, strong: 1, solid: 2, ordinary: 3 }[d.verdict] ?? 2;
}
