async function scenario(h) {
  const visible = (sel) => { const el = h.$(sel); return !!el && getComputedStyle(el).display !== "none" && getComputedStyle(el).visibility === "visible"; };
  h.check("new journal marks the page as new", document.body.classList.contains("is-new"));
  h.check("one unmistakable first action", /Start or plan a grow/.test(h.$("#hero-start").textContent));
  h.check("map and stories tabs are tucked away", !visible("[data-tab-btn=map]") && !visible("[data-tab-btn=stories]"));
  h.check("a teaser says what unfolds", visible("#unfold-teaser") && h.$$("#unfold-teaser article").length === 2);
  h.check("backup notice links to the backup tools", !!h.$(".hero-aside .backup-link[href='#backup']"));
  h.check("check-in extras are tucked into an optional section", !!h.$("#checkin-more") && !!h.$("#checkin-more input[name=temperature]") && !h.$("#checkin-more").open);

  h.click(h.$("#hero-start"));
  h.check("first action focuses the grow name", await h.until(() => document.activeElement && document.activeElement.name === "name", 2000));

  const form = h.$("#new-grow-form");
  h.fill(form.elements.name, "First oysters"); h.fill(form.elements.species, "Oyster");
  form.elements.planFirst.checked = true; form.elements.planFirst.dispatchEvent(new Event("change", { bubbles: true }));
  h.submit(form);
  await h.sleep(100);
  h.check("adding a grow unfolds the map and stories tabs", !document.body.classList.contains("is-new") && visible("[data-tab-btn=map]") && visible("[data-tab-btn=stories]") && !visible("#unfold-teaser"));
}
