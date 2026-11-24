async function scenario(h) {
  const btn = h.$("[data-load-sample]") || h.$$("button").find((b) => /sample journal/i.test(b.textContent));
  h.check("sample button exists", !!btn);
  h.click(btn);
  await h.sleep(600);
  location.hash = "map";
  await h.sleep(600);
  const svg = h.$("#mycelial-map");
  h.check("sample map shows several mushroom sprites", h.$$(".mush", svg).length >= 3, String(h.$$(".mush", svg).length));
  location.hash = "academy"; await h.sleep(200);
  [...document.querySelectorAll("#quest-picker button")].find((b) => /popcorn/i.test(b.textContent)).click(); await h.sleep(200);
  const c = document.createElement("canvas"); c.width = 40; c.height = 40; c.getContext("2d").fillRect(0, 0, 40, 40);
  const blob = await new Promise((r) => c.toBlob(r, "image/png"));
  const dt = new DataTransfer(); dt.items.add(new File([blob], "a.png", { type: "image/png" }));
  const input = h.$('.step[data-key="popcorn:dry"] input[data-capture="photo"]');
  input.files = dt.files; input.dispatchEvent(new Event("change", { bubbles: true }));
  await h.sleep(900);
  const saved = JSON.parse(localStorage.getItem("mycoquest-standalone-grow-log-v3"));
  h.check("capture works on top of the sample journal", !!saved.trail && saved.trail.length === 6 && saved.trail.some((c) => !String(c.id).startsWith("sample-cap-")), JSON.stringify(saved.trail));
  h.$("#map").scrollIntoView();
}
