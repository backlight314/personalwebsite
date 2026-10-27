// interactive prompt: a few shell commands over the content already on the page
(function () {
  const form = document.getElementById("prompt");
  const input = document.getElementById("cmd-in");
  const log = document.getElementById("log");
  const screen = document.querySelector(".screen");
  const shell = document.querySelector(".pane-shell");

  // read projects and links from the page so there's one place to edit them
  const projects = {};
  for (const tab of document.querySelectorAll('[role="tab"]')) {
    projects[tab.querySelector(".fname").textContent.trim()] = document.querySelector("#" + tab.getAttribute("aria-controls") + " .md");
  }
  const links = {};
  for (const a of document.querySelectorAll(".links a")) {
    links[a.textContent.trim().replace(/\/$|\.pdf$/, "")] = a;
  }

  // top-level files like experience.log: every section marked with data-file
  const files = {};
  for (const sec of document.querySelectorAll("[data-file]")) files[sec.dataset.file] = sec;
  const fileBody = sec => {
    const frag = document.createDocumentFragment();
    for (const el of sec.children) if (!el.matches(".cmd")) frag.append(el.cloneNode(true));
    return frag;
  };

  const linkNames = [...document.querySelectorAll(".links a")].map(a => a.textContent.trim());

  const help = [
    ["help", "show this list"],
    ["whoami", "who I am"],
    ["ls [dir]", "list files, links/ or projects/"],
    ["cat <file>", "read a file, e.g. cat experience.log"],
    ["open <link>", Object.keys(links).join(", ")],
    ["history", "commands you've run"],
    ["clear", "clear this pane"],
  ];

  const history = [];
  let back = 0;

  const text = (s, cls = "out") => {
    const p = document.createElement("p");
    p.className = cls;
    p.textContent = s;
    return p;
  };
  const linkFile = arg => links[arg.replace(/^(\.\/)?links\//, "").replace(/\/$|\.pdf$/, "")];
  const projectFile = arg => {
    const name = arg.replace(/^(\.\/)?projects\//, "");
    return projects[name] || projects[name + ".md"];
  };

  // follow a page link; mailto always stays put so it doesn't leave a blank tab
  const visit = (a, newTab) => {
    const external = a.protocol.startsWith("http") && (newTab || a.target === "_blank" || a.host !== location.host);
    if (external) window.open(a.href, "_blank", "noopener");
    else location.href = a.href;
    return text(`opening ${a.textContent.trim()}...`);
  };

  const commands = {
    help: () => text(help.map(([c, d]) => c.padEnd(13) + d).join("\n")),
    whoami: () => {
      const frag = document.createDocumentFragment();
      frag.append(text(document.getElementById("name").textContent), document.querySelector("section .out").cloneNode(true));
      return frag;
    },
    ls: arg => {
      const dir = (arg || "").replace(/\/$/, "");
      if (!dir || dir === "." || dir === "~") return text([...Object.keys(files), "links/", "projects/"].join("  "));
      if (files[dir.replace(/^\.\//, "")]) return text(dir);
      if (dir === "projects") return text(Object.keys(projects).join("  "));
      if (dir === "links") return document.querySelector(".links").cloneNode(true);
      // a single link: open it in a new tab
      if (dir.startsWith("links/") && linkFile(dir)) return visit(linkFile(dir), true);
      if (dir.startsWith("projects/") && projectFile(dir)) return text(dir);
      return text(`ls: ${arg}: No such file or directory`, "out err");
    },
    cat: arg => {
      if (!arg) return text("usage: cat <file>", "out err");
      const file = files[arg.replace(/^\.\//, "")];
      if (file) return fileBody(file);
      const md = projectFile(arg);
      if (md) return md.cloneNode(true);
      if (/^(links|projects)\/?$/.test(arg)) return text(`cat: ${arg}: Is a directory`, "out err");
      return text(`cat: ${arg}: No such file or directory`, "out err");
    },
    open: arg => {
      const a = links[(arg || "").replace(/\/$/, "").replace(/\.pdf$/, "")] || links[arg];
      if (!a) return text(arg ? `open: ${arg}: not found. Try: ${Object.keys(links).join(", ")}` : "usage: open <link>", "out err");
      return visit(a);
    },
    history: () => text(history.map((c, i) => String(i + 1).padStart(4) + "  " + c).join("\n")),
    pwd: () => text("/home/alina"),
    date: () => text(new Date().toString()),
    echo: arg => text(arg),
    sudo: () => text("alina is not in the sudoers file. This incident will be reported.", "out err"),
    exit: () => text("there's no leaving. try 'help'."),
    // like clear in one tmux pane: the info pane stays put
    clear: () => {
      log.replaceChildren();
      for (const el of shell.querySelectorAll("section")) el.hidden = true;
      return null;
    },
  };
  for (const name of Object.keys(links)) commands[name] = () => commands.open(name);

  const run = line => {
    const [cmd, ...rest] = line.trim().split(/\s+/);
    const arg = rest.join(" ");
    const entry = document.createElement("div");
    const echo = document.createElement("p");
    echo.className = "cmd";
    echo.innerHTML = '<span class="ps">alina@columbia</span>:~$ ';
    echo.append(line);
    entry.append(echo);
    if (cmd) {
      const fn = commands[cmd.toLowerCase()];
      const out = fn ? fn(arg) : text(`command not found: ${cmd}. Type 'help' to see what works.`, "out err");
      if (out === null) return; // clear
      entry.append(out);
    }
    log.append(entry);
  };

  // tab completes the command, or the file/link name after it
  const complete = () => {
    const parts = input.value.split(/\s+/);
    const word = parts[parts.length - 1];
    let pool;
    if (parts.length === 1) pool = Object.keys(commands);
    else if (parts[0] === "cat") pool = [...Object.keys(files), ...Object.keys(projects)];
    else if (parts[0] === "open") pool = Object.keys(links);
    else if (parts[0] === "ls") pool = [...Object.keys(files), "links/", "projects/", ...linkNames.map(n => "links/" + n), ...Object.keys(projects).map(n => "projects/" + n)];
    else return;
    const prefix = parts[0] === "ls" ? word : word.replace(/^projects\//, "");
    // only offer the next path segment, so "pro" completes to "projects/"
    const hits = pool.filter(p => p !== prefix && p.startsWith(prefix) && !/\/./.test(p.slice(prefix.length)));
    if (hits.length === 1) {
      parts[parts.length - 1] = hits[0];
      input.value = parts.join(" ") + (parts.length === 1 ? " " : "");
    } else if (hits.length > 1) {
      const entry = document.createElement("div");
      entry.append(text(hits.join("  ")));
      log.append(entry);
    }
  };

  form.addEventListener("submit", e => {
    e.preventDefault();
    const line = input.value;
    if (line.trim()) history.push(line);
    back = 0;
    input.value = "";
    run(line);
    form.scrollIntoView({ block: "nearest" });
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Tab" && input.value) {
      e.preventDefault();
      complete();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (!history.length) return;
      e.preventDefault();
      back = Math.max(0, Math.min(history.length, back + (e.key === "ArrowUp" ? 1 : -1)));
      input.value = back ? history[history.length - back] : "";
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      commands.clear();
    }
  });

  // status bar clock, tmux style: 14:05 27-Oct-26
  const clock = document.querySelector(".status .clock");
  const tick = () => {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    const mon = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")[d.getMonth()];
    clock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}-${mon}-${pad(d.getFullYear() % 100)}`;
  };
  tick();
  setInterval(tick, 15000);

  // clicking empty terminal space focuses the prompt, like a real one
  screen.addEventListener("click", e => {
    if (e.target.closest("a, button, input") || String(getSelection())) return;
    input.focus({ preventScroll: true });
  });
})();
