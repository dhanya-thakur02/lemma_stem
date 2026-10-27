/* =========================
   WARM-UP DATA
   lemma: null means the word does not change.
   Lemmas checked with NLTK WordNetLemmatizer (with the correct part of speech).
========================= */

const practiceWords = [
    { word: "The",      lemma: null },
    { word: "children", lemma: "child" },
    { word: "were",     lemma: "be" },
    { word: "playing",  lemma: "play" },
    { word: "in",       lemma: null },
    { word: "the",      lemma: null },
    { word: "garden",   lemma: null }
];
let practiceSelection = new Set();

/* =========================
   TASK DATA
   type "choice": one or more rows, pick one option per row.
   type "select": click all the words that match.
   Stems checked with NLTK PorterStemmer; lemmas with NLTK WordNetLemmatizer.
========================= */

const METHOD_OPTIONS = ["Stemming", "Lemmatization"];

const questions = [
    {
        type: "choice",
        title: "Pick the stem",
        instruction: "A stemmer chops endings with fixed rules. Choose the stem the Porter stemmer produces for each word.",
        prompt: "What is the Porter stem of each word?",
        items: [
            { label: "studies",    options: ["study", "studi", "stud"],          answer: "studi" },
            { label: "caring",     options: ["care", "car", "cari"],             answer: "care" },
            { label: "generously", options: ["gener", "generous", "generou"],    answer: "gener" }
        ],
        explain: "A stem is not always a real word: <strong>studies → studi</strong> and <strong>generously → gener</strong>. " +
                 "Porter's rules also put the e back in <strong>caring → care</strong>. The goal of a stemmer is a shared root, not a valid word."
    },
    {
        type: "choice",
        title: "Pick the lemma",
        instruction: "A lemmatizer returns the dictionary form. The part of speech is given for each word, because the lemma depends on it.",
        prompt: "What is the lemma of each word?",
        items: [
            { label: "mice (noun)",       options: ["mice", "mouse", "mic"],      answer: "mouse" },
            { label: "better (adjective)", options: ["bet", "better", "good"],    answer: "good" },
            { label: "was (verb)",        options: ["be", "wa", "wass"],          answer: "be" }
        ],
        explain: "A lemmatizer uses a vocabulary, so it handles irregular forms: <strong>mice → mouse</strong>, " +
                 "<strong>better → good</strong>, <strong>was → be</strong>. A stemmer cannot do this because it only strips endings. " +
                 "Without the part of speech, NLTK's lemmatizer assumes a noun and would wrongly return \"wa\" for \"was\"."
    },
    {
        type: "choice",
        title: "Which method produced this?",
        instruction: "Look at each input and output pair and decide whether it came from stemming or lemmatization.",
        prompt: "Label each transformation.",
        items: [
            { label: "studies → studi", options: METHOD_OPTIONS, answer: "Stemming" },
            { label: "mice → mouse",    options: METHOD_OPTIONS, answer: "Lemmatization" },
            { label: "argued → argu",   options: METHOD_OPTIONS, answer: "Stemming" },
            { label: "went → go",       options: METHOD_OPTIONS, answer: "Lemmatization" }
        ],
        explain: "<strong>studi</strong> and <strong>argu</strong> are not real words, which is a sign of rule-based suffix chopping (stemming). " +
                 "<strong>mouse</strong> and <strong>go</strong> are real dictionary words that cannot be reached by trimming letters, so they come from lemmatization."
    },
    {
        type: "select",
        title: "Words with the same root",
        instruction: "Treat every word as a verb. Click all the words that a lemmatizer maps to the lemma \"run\".",
        prompt: "Which words become \"run\" after lemmatization?",
        sentence: ["running", "runs", "ran", "runner", "runway"],
        answers: [0, 1, 2],
        explain: "A lemmatizer maps <strong>running, runs and ran</strong> to <strong>run</strong>. " +
                 "<strong>runner</strong> and <strong>runway</strong> are different words, so they stay as they are. " +
                 "The Porter stemmer handles running and runs, but misses the irregular <strong>ran</strong> (it stays \"ran\")."
    },
    {
        type: "choice",
        title: "Choose the method",
        instruction: "For each situation, decide which method fits better: stemming (fast, rough) or lemmatization (accurate, slower).",
        prompt: "Which method would you use?",
        items: [
            { label: "A search engine must match \"connect\", \"connected\" and \"connecting\" across millions of pages as fast as possible.",
              options: METHOD_OPTIONS, answer: "Stemming" },
            { label: "A chatbot must work with real dictionary words, for example turning \"geese\" into \"goose\".",
              options: METHOD_OPTIONS, answer: "Lemmatization" },
            { label: "A quick keyword count over a huge pile of logs, where an odd root such as \"gener\" is acceptable.",
              options: METHOD_OPTIONS, answer: "Stemming" },
            { label: "A vocabulary app must show the dictionary form of \"bought\" as \"buy\".",
              options: METHOD_OPTIONS, answer: "Lemmatization" }
        ],
        explain: "Choose <strong>stemming</strong> when speed and scale matter and an imperfect root is fine. " +
                 "Choose <strong>lemmatization</strong> when you need valid, grammatically correct base forms and can afford the extra work."
    }
];

let currentQuestionIndex = 0;
let selections = questions.map(q =>
    q.type === "select" ? new Set() : q.items.map(() => null)
);
let questionResults = new Array(questions.length).fill(null);

/* =========================
   SHARED HELPERS
========================= */

function makeChip(text, isSelected, onClick) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "word-chip" + (isSelected ? " selected" : "");
    chip.textContent = text;
    chip.setAttribute("aria-pressed", isSelected ? "true" : "false");
    chip.addEventListener("click", onClick);
    return chip;
}

function setChipSelected(chip, isSelected) {
    chip.classList.toggle("selected", isSelected);
    chip.setAttribute("aria-pressed", isSelected ? "true" : "false");
}

function sameSet(a, b) {
    return a.size === b.size && [...a].every(v => b.has(v));
}

/* =========================
   WARM-UP
========================= */

function renderPractice() {
    const container = document.getElementById("practiceSentence");
    container.innerHTML = "";
    practiceSelection = new Set();

    practiceWords.forEach((item, index) => {
        const chip = makeChip(item.word, false, () => {
            if (practiceSelection.has(index)) practiceSelection.delete(index);
            else practiceSelection.add(index);
            setChipSelected(chip, practiceSelection.has(index));
        });
        container.appendChild(chip);
    });
}

function checkPractice() {
    const feedback = document.getElementById("practiceFeedback");
    const result = document.getElementById("practiceResult");

    const correct = new Set(
        practiceWords.map((w, i) => (w.lemma !== null ? i : -1)).filter(i => i !== -1)
    );
    const isCorrect = sameSet(practiceSelection, correct);

    feedback.className = isCorrect ? "feedback show correct" : "feedback show wrong";
    feedback.innerHTML = isCorrect
        ? "<strong>🎉 Correct!</strong><br>You found every word whose lemma is different."
        : "<strong>❌ Not quite.</strong><br>Ask yourself for each word: is it already the dictionary form? Plural nouns and inflected verbs usually change.";

    result.className = "practice-result show";
    result.innerHTML = `
        <div class="result-label">After lemmatizing the sentence:</div>
        <div class="result-chips">
            ${practiceWords.map(w => w.lemma === null
                ? `<span class="result-chip">${w.word.toLowerCase()}</span>`
                : `<span class="result-chip changed">${w.word} → ${w.lemma}</span>`
            ).join("")}
        </div>
    `;

    document.querySelectorAll("#practiceSentence .word-chip").forEach((chip, index) => {
        chip.classList.remove("correct", "missed", "wrong-selected");
        if (correct.has(index)) {
            chip.classList.add(practiceSelection.has(index) ? "correct" : "missed");
        } else if (practiceSelection.has(index)) {
            chip.classList.add("wrong-selected");
        }
    });
}

/* =========================
   TASK RENDERING
========================= */

function renderQuestion() {
    const q = questions[currentQuestionIndex];
    const area = document.getElementById("taskArea");
    area.innerHTML = "";

    document.getElementById("currentQuestion").textContent = currentQuestionIndex + 1;
    document.getElementById("questionInstruction").textContent = q.instruction;

    const box = document.getElementById("questionBox");
    box.innerHTML = "";
    const title = document.createElement("span");
    title.className = "question-title";
    title.textContent = q.title;
    const prompt = document.createElement("div");
    prompt.className = "question-prompt";
    prompt.textContent = q.prompt;
    box.append(title, prompt);

    if (q.type === "select") renderSelectQuestion(q, area);
    else renderChoiceQuestion(q, area);

    resetFeedback();

    if (questionResults[currentQuestionIndex] !== null) {
        applyMarks();
        showFeedback(true);
    }

    updateSelectionStatus();
    updateNavigationButtons();
}

function renderSelectQuestion(q, area) {
    const wrap = document.createElement("div");
    wrap.className = "task-word-area";
    wrap.id = "taskWords";
    const selection = selections[currentQuestionIndex];

    q.sentence.forEach((word, index) => {
        const chip = makeChip(word, selection.has(index), () => {
            if (selection.has(index)) selection.delete(index);
            else selection.add(index);
            setChipSelected(chip, selection.has(index));
            onSelectionChanged();
        });
        wrap.appendChild(chip);
    });
    area.appendChild(wrap);
}

function renderChoiceQuestion(q, area) {
    const list = document.createElement("div");
    list.className = "choice-list";
    const picks = selections[currentQuestionIndex];

    q.items.forEach((item, rowIndex) => {
        const row = document.createElement("div");
        row.className = "choice-row";
        row.dataset.row = rowIndex;

        const label = document.createElement("div");
        label.className = "choice-label";
        label.textContent = item.label;

        const options = document.createElement("div");
        options.className = "choice-options";

        item.options.forEach(option => {
            const chip = makeChip(option, picks[rowIndex] === option, () => {
                picks[rowIndex] = option;
                options.querySelectorAll(".word-chip").forEach(c => setChipSelected(c, c === chip));
                onSelectionChanged();
            });
            chip.dataset.option = option;
            options.appendChild(chip);
        });

        row.append(label, options);
        list.appendChild(row);
    });
    area.appendChild(list);
}

function onSelectionChanged() {
    // Changing an answer after checking clears the old result so it can be checked again.
    if (questionResults[currentQuestionIndex] !== null) {
        questionResults[currentQuestionIndex] = null;
        clearMarks();
        resetFeedback();
    }
    updateSelectionStatus();
}

function updateSelectionStatus() {
    const q = questions[currentQuestionIndex];
    const status = document.getElementById("selectionStatus");
    if (q.type === "select") {
        const count = selections[currentQuestionIndex].size;
        status.textContent = `${count} word${count === 1 ? "" : "s"} selected`;
    } else {
        const answered = selections[currentQuestionIndex].filter(v => v !== null).length;
        status.textContent = `${answered} of ${q.items.length} answered`;
    }
}

/* =========================
   CHECKING
========================= */

function checkAnswer() {
    const q = questions[currentQuestionIndex];
    const feedback = document.getElementById("feedback");
    let isCorrect;

    if (q.type === "select") {
        const selected = selections[currentQuestionIndex];
        if (selected.size === 0) {
            feedback.className = "feedback show wrong";
            feedback.innerHTML = "<strong>Select at least one word first.</strong><br>Click the words you think match, then check again.";
            return;
        }
        isCorrect = sameSet(selected, new Set(q.answers));
    } else {
        const picks = selections[currentQuestionIndex];
        if (picks.some(p => p === null)) {
            feedback.className = "feedback show wrong";
            feedback.innerHTML = "<strong>Answer every row first.</strong><br>Pick one option in each row, then check again.";
            return;
        }
        isCorrect = q.items.every((item, i) => picks[i] === item.answer);
    }

    questionResults[currentQuestionIndex] = isCorrect;
    applyMarks();
    showFeedback(false);
}

function applyMarks() {
    const q = questions[currentQuestionIndex];

    if (q.type === "select") {
        const selected = selections[currentQuestionIndex];
        const correct = new Set(q.answers);
        document.querySelectorAll("#taskWords .word-chip").forEach((chip, index) => {
            chip.classList.remove("correct", "missed", "wrong-selected");
            if (correct.has(index)) chip.classList.add(selected.has(index) ? "correct" : "missed");
            else if (selected.has(index)) chip.classList.add("wrong-selected");
        });
        return;
    }

    const picks = selections[currentQuestionIndex];
    document.querySelectorAll(".choice-row").forEach(row => {
        const rowIndex = Number(row.dataset.row);
        const item = q.items[rowIndex];
        const rowCorrect = picks[rowIndex] === item.answer;
        row.classList.remove("row-correct", "row-wrong");
        row.classList.add(rowCorrect ? "row-correct" : "row-wrong");

        row.querySelectorAll(".word-chip").forEach(chip => {
            chip.classList.remove("correct", "missed", "wrong-selected");
            if (chip.dataset.option === item.answer) chip.classList.add("correct");
            else if (chip.dataset.option === picks[rowIndex]) chip.classList.add("wrong-selected");
        });
    });
}

function clearMarks() {
    document.querySelectorAll("#taskArea .word-chip").forEach(chip =>
        chip.classList.remove("correct", "missed", "wrong-selected"));
    document.querySelectorAll(".choice-row").forEach(row =>
        row.classList.remove("row-correct", "row-wrong"));
}

function showFeedback(isSaved) {
    const q = questions[currentQuestionIndex];
    const feedback = document.getElementById("feedback");
    const explain = document.getElementById("explainBox");
    const ok = questionResults[currentQuestionIndex] === true;

    feedback.className = ok ? "feedback show correct" : "feedback show wrong";
    if (ok) {
        feedback.innerHTML = isSaved
            ? "<strong>🎉 Correct!</strong><br>You answered this question correctly."
            : "<strong>🎉 Correct!</strong><br>Every answer is right.";
    } else {
        feedback.innerHTML = "<strong>❌ Not quite.</strong><br>The correct answers are highlighted in green. Read the explanation below, then change your answers to try again.";
    }

    explain.className = "explain-box show";
    explain.innerHTML = "<strong>Why:</strong> " + q.explain;
}

function resetFeedback() {
    const feedback = document.getElementById("feedback");
    const explain = document.getElementById("explainBox");
    feedback.className = "feedback";
    feedback.innerHTML = "";
    explain.className = "explain-box";
    explain.innerHTML = "";
}

/* =========================
   NAVIGATION & FINISH
========================= */

function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

function updateNavigationButtons() {
    const previousButton = document.getElementById("previousButton");
    const nextButton = document.getElementById("nextButton");
    previousButton.disabled = currentQuestionIndex === 0;

    if (currentQuestionIndex === questions.length - 1) {
        nextButton.textContent = "Finish Task ✓";
        nextButton.onclick = finishTask;
    } else {
        nextButton.textContent = "Next →";
        nextButton.onclick = nextQuestion;
    }
}

function finishTask() {
    const score = questionResults.filter(r => r === true).length;
    const taskCard = document.querySelector(".task-card");

    const recap = questions.map((q, i) => {
        const status = questionResults[i] === true
            ? '<span class="ok">Correct</span>'
            : questionResults[i] === false
                ? '<span class="no">Incorrect</span>'
                : '<span class="no">Not checked</span>';
        return `<li><span>${i + 1}. ${q.title}</span>${status}</li>`;
    }).join("");

    taskCard.innerHTML = `
        <div class="final-score">
            <div class="score-icon">🎉</div>
            <h2>Task Completed!</h2>
            <p>You completed all ${questions.length} stemming and lemmatization challenges.</p>
            <div class="score-circle">${score}/${questions.length}</div>
            <ul class="recap">${recap}</ul>
            <p class="score-message">
                ${score === questions.length
                    ? "Excellent! You can tell stems from lemmas and choose the right method."
                    : score >= 3
                    ? "Good job! Review the questions you missed and try again."
                    : "Keep practicing! Remember: stemming chops endings, lemmatization looks up the dictionary form."
                }
            </p>
            <button onclick="restartQuiz()">Try Again</button>
        </div>
    `;
}

function restartQuiz() {
    location.reload();
}

document.addEventListener("DOMContentLoaded", function () {
    renderPractice();
    renderQuestion();
});
