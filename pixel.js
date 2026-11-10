// one page, four views (home, projects, experience, awards) addressed by #hash
(function () {
  const views = {};
  for (const sec of document.querySelectorAll("[data-view]")) views[sec.dataset.view] = sec;
  const goLinks = document.querySelectorAll("[data-go]");
  const content = document.getElementById("content");
  const menu = [...document.querySelectorAll(".menu a")];
  const baseTitle = document.title;
  let current = null;

  const render = view => {
    view = view in views ? view : "";
    if (view === current) return;
    current = view;
    for (const [name, sec] of Object.entries(views)) sec.hidden = name !== view;
    for (const a of goLinks) {
      if (a.dataset.go === view && !a.closest(".menu")) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    }
    document.body.dataset.view = view;
    document.title = view ? `${view[0].toUpperCase() + view.slice(1)} · ${baseTitle}` : baseTitle;
    content.scrollTop = 0;
  };

  const go = (view, focus) => {
    if (location.hash.slice(1) !== view) history.pushState(null, "", view ? "#" + view : location.pathname + location.search);
    render(view);
    if (!focus) return;
    window.scrollTo(0, 0);
    const target = view ? views[view].querySelector("h2") : menu[0];
    if (view) target.tabIndex = -1;
    target.focus({ preventScroll: true });
  };

  for (const a of goLinks) {
    a.addEventListener("click", e => {
      if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      go(a.dataset.go, true);
    });
  }
  addEventListener("popstate", () => render(location.hash.slice(1)));
  addEventListener("hashchange", () => render(location.hash.slice(1)));

  // game-style start menu: the cursor follows hover, focus and arrow keys
  let sel = 0;
  const select = i => {
    sel = (i + menu.length) % menu.length;
    menu.forEach((a, j) => a.classList.toggle("sel", j === sel));
  };
  menu.forEach((a, i) => {
    a.addEventListener("mouseenter", () => select(i));
    a.addEventListener("focus", () => select(i));
  });
  select(0);

  addEventListener("keydown", e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Escape" && current) { go("", true); return; }
    if (current !== "") return;
    const typing = e.target.matches("input, textarea");
    if (typing) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      select(sel + (e.key === "ArrowDown" ? 1 : -1));
      menu[sel].focus();
    } else if (e.key === "Enter" && !e.target.closest("a, button")) {
      menu[sel].click();
    }
  });

  render(location.hash.slice(1));
})();
