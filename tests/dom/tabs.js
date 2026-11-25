async function scenario(h) {
  const shown = (sel) => getComputedStyle(h.$(sel)).visibility === "visible" && getComputedStyle(h.$(sel)).display !== "none";
  const tab = (name) => h.$("[data-tab-btn=" + name + "]");
  h.check("grows tab is open first", tab("grows").getAttribute("aria-selected") === "true" && shown("#grows"));
  h.check("other sections are not shown", !shown("#academy") && !shown("#trophies") && !shown("#backup"));
  h.click(tab("academy"));
  h.check("choosing a tab swaps the section", shown("#academy") && !shown("#grows") && location.hash === "#academy");
  h.click(tab("trophies"));
  h.check("trophies tab holds the XP feed too", shown("#trophies") && shown("#feed"));
  h.click(h.$(".backup-link"));
  h.check("in-page links switch tabs", shown("#backup") && tab("backup").getAttribute("aria-selected") === "true");
  location.hash = "#academy"; await h.sleep(100);
  h.check("hash links still work", shown("#academy"));
  h.click(h.$("#sample-cta [data-load-sample]"));
  await h.sleep(600);
  h.check("loading the sample opens the map tab", shown("#map") && tab("map").getAttribute("aria-selected") === "true");
  const box = h.$("#mycelial-map").getAttribute("viewBox").split(" ").map(Number);
  h.check("map measured itself correctly", box[2] > 300 && box[3] > 200 && h.$$("#mycelial-map path").length > 5, box.join(" "));
}
