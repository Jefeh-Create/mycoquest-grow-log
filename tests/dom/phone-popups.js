// Run at a tiny phone size: PHONE=320x568 node tests/dom.mjs tests/dom/phone-popups.js
// Every pop-up must fit inside the screen, keep its close/primary button reachable, and not scroll sideways.
async function scenario(h) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const fits = (el, name) => {
    const r = el.getBoundingClientRect();
    h.check(name + " fits the screen width", r.left >= -1 && r.right <= vw + 1, `left ${r.left.toFixed(0)} right ${r.right.toFixed(0)} of ${vw}`);
    h.check(name + " fits the screen height", r.top >= -1 && r.bottom <= vh + 1, `top ${r.top.toFixed(0)} bottom ${r.bottom.toFixed(0)} of ${vh}`);
    h.check(name + " has no sideways scroll", el.scrollWidth <= el.clientWidth + 1 && [...el.querySelectorAll("*")].every((c) => c.scrollWidth <= c.clientWidth + 1 || getComputedStyle(c).overflowX !== "visible" || c.tagName === "svg" || c.closest("svg")), "");
  };
  const reachable = async (el, name) => {
    el.scrollIntoView({ block: "nearest" }); await h.sleep(50);
    const r = el.getBoundingClientRect();
    h.check(name + " can be reached on screen", r.bottom <= vh + 1 && r.top >= -1 && r.width >= 40 && r.height >= 40, `top ${r.top.toFixed(0)} bottom ${r.bottom.toFixed(0)} size ${r.width.toFixed(0)}x${r.height.toFixed(0)}`);
  };
  h.check("running at phone size", vw <= 360, String(vw));

  // The check-in dialog, from a real grow.
  const form = h.$("#new-grow-form");
  h.fill(form.elements.name, "Tiny phone batch"); h.fill(form.elements.species, "Blue oyster"); h.submit(form);
  await h.sleep(300);
  h.click(h.$$("#grow-list button").find((b) => /check-in/i.test(b.textContent)));
  await h.until(() => h.$("#checkin-dialog").open, 2000);
  const checkin = h.$("#checkin-dialog");
  fits(checkin, "check-in dialog");
  const save = h.$("#checkin-form button[type=submit]") || h.$$("#checkin-form button").pop();
  await reachable(save, "check-in save button");
  const close = h.$$("#checkin-dialog button").find((b) => /close|cancel|×|✕/i.test(b.textContent + (b.getAttribute("aria-label") || "")));
  if (close) await reachable(close, "check-in close button");
  checkin.close();
  await h.sleep(400);

  // First check-in unlocks a trophy: the celebration pop-up.
  const celebrate = await h.until(() => h.$("#celebrate-dialog") && h.$("#celebrate-dialog").open, 300) ? h.$("#celebrate-dialog") : null;
  if (celebrate) { fits(celebrate, "celebration"); await reachable(h.$("#celebrate-collect"), "celebration collect button"); celebrate.close(); }

  // Trophy detail pop-up.
  location.hash = "trophies"; await h.sleep(400);
  const card = h.$(".trophy-card") || h.$("[data-trophy]");
  if (card) {
    h.click(card.querySelector("button") || card); await h.until(() => h.$("#trophy-detail") && h.$("#trophy-detail").open, 2000);
    const detail = h.$("#trophy-detail");
    fits(detail, "trophy detail");
    const btn = h.$$("#trophy-detail button").pop(); if (btn) await reachable(btn, "trophy detail button");
    detail.close();
  } else h.check("trophy card found", false);

  // Toast stays inside the screen.
  const toast = h.$(".toast");
  if (toast) { const r = toast.getBoundingClientRect(); h.check("toast fits", r.left >= 0 && r.right <= vw, `${r.left}-${r.right}`); }
}
