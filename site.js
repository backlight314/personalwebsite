// drifting clouds behind the page
(function clouds() {
  const layer = document.createElement("div");
  layer.className = "clouds";
  layer.setAttribute("aria-hidden", "true");
  const specs = [
    { w: 340, y: 6, t: 95, d: -10, o: 0.75, x: 10 },
    { w: 220, y: 18, t: 130, d: -70, o: 0.6, x: 70 },
    { w: 420, y: 34, t: 160, d: -40, o: 0.55, x: 40 },
    { w: 260, y: 52, t: 110, d: -85, o: 0.65, x: 80 },
    { w: 300, y: 62, t: 140, d: -20, o: 0.5, x: 5 },
  ];
  for (const c of specs) {
    const img = document.createElement("img");
    img.src = "cloud.svg";
    img.alt = "";
    img.className = "cloud";
    img.style.cssText = `--w:${c.w}px;--y:${c.y}%;--t:${c.t}s;--delay:${c.d}s;--o:${c.o};--x:${c.x}`;
    layer.appendChild(img);
  }
  document.body.prepend(layer);
})();

// snow toggle, bottom right
const snow = document.createElement("div");
snow.className = "snow";
snow.setAttribute("aria-hidden", "true");
const weather = document.createElement("button");
weather.className = "weather-btn";
weather.type = "button";
weather.setAttribute("aria-pressed", "false");
weather.textContent = "❄️ Make it snow";
document.body.append(snow, weather);
let made = false;

// build the flakes the first time it snows
function makeFlakes() {
  const n = window.innerWidth < 600 ? 60 : 120;
  for (let i = 0; i < n; i++) {
    const f = document.createElement("i");
    const size = 2 + Math.random() * 5;
    f.style.left = Math.random() * 100 + "%";
    f.style.setProperty("--s", size + "px");
    f.style.setProperty("--o", (0.55 + Math.random() * 0.45).toFixed(2));
    f.style.setProperty("--b", size > 5 ? "1px" : "0px");
    f.style.setProperty("--t", (7 + Math.random() * 9).toFixed(1) + "s");
    f.style.setProperty("--sw", (2 + Math.random() * 3).toFixed(1) + "s");
    f.style.setProperty("--delay", (-Math.random() * 16).toFixed(1) + "s");
    f.style.setProperty("--y", Math.random() * 100 + "%");
    snow.appendChild(f);
  }
  made = true;
}

weather.addEventListener("click", () => {
  if (!made) makeFlakes();
  const on = document.body.classList.toggle("snowing");
  weather.setAttribute("aria-pressed", String(on));
  weather.textContent = on ? "☀️ Let the sun out" : "❄️ Make it snow";
});
