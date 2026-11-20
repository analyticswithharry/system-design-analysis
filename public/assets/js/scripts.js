document.addEventListener("DOMContentLoaded", () => {
  const DATA_PATH = "/assets/data/cn7039/";
  // Image paths in the JSON are written from the site root, e.g. "assets/images/week_02/waterfall.svg".
  // This makes them work from any page URL, and leaves full https:// links untouched.
  const asset = (p) => (/^(https?:)?\/\//.test(p) || p.startsWith("/") ? p : "/" + p);
  const $ = (id) => document.getElementById(id);
  const sel = $("chapter-select"), startBtn = $("start-quiz-btn");
  const fb = $("interactive-feedback"), exp = $("show-explanation"), shuf = $("shuffle");
  const nextBtn = $("next-btn");

  let questions = [], current = 0, answers = {}, correct = 0, locked = false;

  /* theme */
  const root = document.documentElement;
  try { root.dataset.theme = localStorage.getItem("theme") || ""; } catch (e) {}
  $("theme-btn").addEventListener("click", () => {
    const t = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch (e) {}
  });

  /* weeks dropdown */
  fetch(DATA_PATH + "weeks.json").then((r) => r.json()).then((weeks) => {
    weeks.forEach((w) => sel.add(new Option(w.name, w.file)));
  }).catch(() => alert("Could not load weeks.json. Run the site from a web server, not by double-clicking."));
  sel.addEventListener("change", () => (startBtn.disabled = !sel.value));

  /* start */
  startBtn.addEventListener("click", async () => {
    try {
      const res = await fetch(DATA_PATH + sel.value);
      if (!res.ok) throw new Error("File not found");
      questions = (await res.json()).filter((q) => q.id && q.question && q.options && q.correctAnswer);
      if (!questions.length) throw new Error("This week has no questions yet");
    } catch (e) { return alert("Could not start: " + e.message); }
    current = 0; correct = 0; answers = {};
    $("setup").hidden = true; $("quiz").hidden = false;
    render();
  });

  // Escape text so labels like <<include>> show literally instead of being read as HTML tags.
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* render one question */
  function render() {
    const q = questions[current]; locked = false;
    $("counter").textContent = `Question ${current + 1} of ${questions.length}`;
    $("live-score").innerHTML = `<i class="fas fa-check-circle"></i> ${correct} correct`;
    $("bar-fill").style.width = `${(current / questions.length) * 100}%`;
    $("q-text").textContent = q.question;

    $("tags").innerHTML = [q.topic && `<span class="tag">${esc(q.topic)}</span>`,
      q.difficulty && `<span class="tag lvl-${String(q.difficulty).toLowerCase()}">${q.difficulty}</span>`].filter(Boolean).join("");

    const fig = $("q-figure");
    fig.hidden = !q.image;
    if (q.image) {
      const img = $("q-img");
      img.onerror = () => { $("q-cap").textContent = "Image not found: " + q.image; };
      img.src = asset(q.image); img.alt = q.imageAlt || ""; $("q-cap").textContent = q.imageCaption || "";
    }

    const idx = q.options.map((_, i) => i);
    const order = shuf.checked ? shuffle(idx) : idx;
    $("options").innerHTML = "";
    order.forEach((i, n) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "option"; b.dataset.value = q.options[i];
      b.setAttribute("role", "radio");
      b.innerHTML = `<span class="key">${String.fromCharCode(65 + n)}</span>` +
        (q.optionImages && q.optionImages[i] ? `<img src="${asset(q.optionImages[i])}" alt="" />` : "") +
        `<span class="label">${esc(q.options[i])}</span><i class="mark fas"></i>`;
      b.addEventListener("click", () => choose(b, q));
      $("options").appendChild(b);
    });

    $("explain").hidden = true;
    nextBtn.disabled = true;
    nextBtn.innerHTML = current === questions.length - 1 ? 'See results <i class="fas fa-flag-checkered"></i>' : 'Next <i class="fas fa-arrow-right"></i>';
  }

  /* answer */
  function choose(btn, q) {
    if (locked) return;
    locked = true;
    const value = btn.dataset.value, ok = value === q.correctAnswer;
    answers[q.id] = value;
    if (ok) correct++;
    $("live-score").innerHTML = `<i class="fas fa-check-circle"></i> ${correct} correct`;
    document.querySelectorAll(".option").forEach((o) => {
      o.disabled = true;
      if (fb.checked) {
        if (o.dataset.value === q.correctAnswer) { o.classList.add("correct"); o.querySelector(".mark").classList.add("fa-check"); }
        else if (o === btn) { o.classList.add("wrong"); o.querySelector(".mark").classList.add("fa-xmark"); }
      } else if (o === btn) o.classList.add("picked");
    });
    if (fb.checked && exp.checked && (q.explanation || q.insight)) {
      const e = $("explain");
      e.className = "explain " + (ok ? "good" : "bad");
      e.innerHTML = `<strong>${ok ? "Correct." : "Not quite."}</strong> ${esc(q.explanation || q.insight)}`;
      e.hidden = false;
    }
    nextBtn.disabled = false; nextBtn.focus();
  }

  /* navigation */
  function finish() {
    localStorage.setItem("quizQuestions", JSON.stringify(questions));
    localStorage.setItem("quizAnswers", JSON.stringify(answers));
    window.location.href = "results.html";
  }
  nextBtn.addEventListener("click", () => (current < questions.length - 1 ? (current++, render()) : finish()));
  $("skip-btn").addEventListener("click", finish);

  document.addEventListener("keydown", (e) => {
    if ($("quiz").hidden) return;
    const opts = document.querySelectorAll(".option");
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= opts.length) opts[n - 1].click();
  });
});
