async function scenario(h) {
  const photo = () => new Promise((res) => {
    const c = document.createElement("canvas"); c.width = 60; c.height = 40; c.getContext("2d").fillRect(0, 0, 60, 40);
    c.toBlob((b) => res(new File([b], "p.png", { type: "image/png" })), "image/png");
  });
  const attach = async (stepKey, file, caption) => {
    const step = h.$(`.step[data-key="${stepKey}"]`);
    h.fill(h.$(".capture-caption", step), caption);
    const input = h.$('input[data-capture="photo"]', step);
    const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await h.until(() => /Saved/.test(h.$(".capture-slot .form-note", h.$(`.step[data-key="${stepKey}"]`)).textContent), 5000);
  };
  // 1. a planning grow with full-detail grain, and an inoculated grow with no check-ins yet
  h.click(h.$("#grow-plan-first"));
  const form = h.$("#new-grow-form");
  h.fill(form.elements.name, "Rye prep"); h.fill(form.elements.species, "Blue oyster"); h.submit(form);
  await h.sleep(150);
  const detailForm = h.$("#grow-list .plan-detail-form");
  h.fill(detailForm.elements.grain, "Rye berries"); h.submit(detailForm);
  await h.sleep(100);
  h.click(h.$("#grow-plan-first"));
  h.fill(form.elements.name, "Active jar"); h.fill(form.elements.species, "Lion's mane");
  h.fill(form.elements.startDate, new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)); h.submit(form);
  await h.sleep(150);

  // 2. map already shows both grows, with no check-ins at all
  location.hash = "map"; await h.sleep(500);
  const svg = h.$("#mycelial-map");
  h.check("map is visible with only planning/new grows", svg.hidden === false);
  h.check("each grow has a seed node", h.$$(".process-node", svg).length === 2, String(h.$$(".process-node", svg).length));

  // 3. capture two Academy steps for the planning grow
  location.hash = "academy"; await h.sleep(200);
  [...document.querySelectorAll("#quest-picker button")].find((b) => /popcorn/i.test(b.textContent)).click(); await h.sleep(200);
  const picker = h.$('.step[data-key="popcorn:soak"] .capture-grow select');
  h.check("capture slot offers a grow picker", !!picker);
  h.fill(picker, [...picker.options].find((o) => /Rye prep/.test(o.textContent)).value);
  await h.sleep(300);
  await attach("popcorn:soak", await photo(), "Kernels soaked");
  await attach("popcorn:simmer", await photo(), "Gentle simmer");

  // 4. the captures are on the map as process nodes
  location.hash = "map"; await h.sleep(500);
  h.check("captures appear as nodes", h.$$(".process-node", svg).length === 4, String(h.$$(".process-node", svg).length));
  const seed = h.$$(".process-node .map-emoji", svg).find((n) => /Rye prep, planning/.test(n.getAttribute("aria-label")));
  h.check("planning seed node is focusable and named", !!seed && seed.getAttribute("tabindex") === "0");
  h.click(seed); await h.sleep(150);
  const detail = h.$("#map-detail");
  h.check("seed popup shows planning status and grain", /Planning/.test(detail.textContent) && /Rye berries/.test(detail.textContent), detail.textContent);
  const soak = h.$$(".process-node .map-emoji", svg).find((n) => /Soak/i.test(n.getAttribute("aria-label")));
  h.check("capture node found for the soak step", !!soak, h.$$(".process-node .map-emoji", svg).map((n) => n.getAttribute("aria-label")).join(" | "));
  h.click(soak);
  h.check("capture popup shows the caption", await h.until(() => /Kernels soaked/.test(detail.textContent), 2000), detail.textContent);
  h.check("capture popup shows the user's photo", await h.until(() => !!detail.querySelector("img.map-detail-photo"), 3000));
  h.check("capture node plays its reaction", soak.classList.contains("react"));
  h.$("#map").scrollIntoView();
}
