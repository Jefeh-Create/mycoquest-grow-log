// Visual helper: enlarges the shelf trophies so emblems can be inspected in a screenshot (run with SHOT=<png>).
async function scenario(h) {
  const style = document.createElement("style");
  style.textContent = "#trophy-grid .trophy-card svg.medal { width: 150px !important; height: 150px !important; } #trophy-grid { grid-template-columns: repeat(5, 1fr) !important; } #trophy-grid .trophy-card p { display: none !important; }";
  document.head.append(style); await h.sleep(300);
  document.documentElement.style.scrollBehavior = "auto";
  h.$("#trophy-grid").scrollIntoView({ block: "center" }); await h.sleep(600);
  h.check("zoomed", true);
}
