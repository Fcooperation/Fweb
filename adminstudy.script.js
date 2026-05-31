const fields = document.querySelectorAll(
"input,textarea,select"
);

const preview =
document.getElementById("preview");

function generateId(){

return (
"Q" +
Date.now() +
Math.floor(Math.random()*1000)
);

}

function getXP(){

const difficulty =
document.getElementById(
"difficulty"
).value;

if(difficulty==="easy") return 10;

if(difficulty==="medium") return 30;

return 50;

}

function buildQuestion(){

const question = {

id: generateId(),

university:
document.getElementById(
"university"
).value,

course:
document.getElementById(
"course"
).value,

question:
document.getElementById(
"question"
).value,

options:[
document.getElementById(
"option1"
).value,
document.getElementById(
"option2"
).value,
document.getElementById(
"option3"
).value,
document.getElementById(
"option4"
).value
],

answer:
document.getElementById(
"answer"
).value,

explanation:
document.getElementById(
"explanation"
).value,

difficulty:
document.getElementById(
"difficulty"
).value,

topic:
document.getElementById(
"topic"
).value,

type:
document.getElementById(
"type"
).value,

year:
Number(
document.getElementById(
"year"
).value
),

session:
document.getElementById(
"session"
).value,

question_number:
Number(
document.getElementById(
"question_number"
).value
),

xp_reward:getXP(),

instructor:
document.getElementById(
"instructor"
).value,

verified:true

};

return question;

}

function updatePreview(){

preview.textContent =
JSON.stringify(
buildQuestion(),
null,
2
);

}

fields.forEach(field=>{

field.addEventListener(
"input",
updatePreview
);

});

updatePreview();

document
.getElementById("submit-btn")
.addEventListener("click", async () => {

  const question = buildQuestion();

  const res = await fetch(
    "https://fweb-backend.onrender.com/admin",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "add_study_question",
        ...question
      })
    }
  );

  const data = await res.json();

  if (data.success) {
    alert("✅ Question added successfully");
  } else {
    alert("❌ Failed: " + (data.error || "Unknown error"));
  }

});

document
.getElementById("json-file")
.addEventListener(
"change",
e=>{

const file =
e.target.files[0];

if(!file) return;

const reader =
new FileReader();

reader.onload=()=>{

document.getElementById(
"bulk-json"
).value =
reader.result;

};

reader.readAsText(file);

}
);

document.getElementById("bulk-btn").addEventListener("click", async () => {

  const btn = document.getElementById("bulk-btn");
  const textArea = document.getElementById("bulk-json");

  let questions;

  // ---------------- PARSE JSON ----------------
  try {
    questions = JSON.parse(textArea.value);
  } catch (err) {
    alert("❌ Invalid JSON format");
    return;
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    alert("❌ Must be an array of questions");
    return;
  }

  // ---------------- LOADING UI ----------------
  btn.disabled = true;
  btn.textContent = `Uploading 0/${questions.length}...`;
  btn.style.opacity = "0.6";

  textArea.disabled = true;
  textArea.style.opacity = "0.4";

  let successCount = 0;

  // ---------------- LOOP SEND ONE BY ONE ----------------
  for (let i = 0; i < questions.length; i++) {

    const q = questions[i];

    try {
      const res = await fetch("https://fweb-backend.onrender.com/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_study_question",
          ...q
        })
      });

      const data = await res.json();

      if (data.success) {
        successCount++;
      } else {
        console.warn("Failed question:", q.id, data.error);
      }

    } catch (err) {
      console.error("Network error:", err);
    }

    // update progress live
    btn.textContent = `Uploading ${i + 1}/${questions.length}...`;
  }

  // ---------------- DONE ----------------
  alert(`✅ Upload complete: ${successCount}/${questions.length} added`);

  btn.disabled = false;
  btn.textContent = "Upload";
  btn.style.opacity = "1";

  textArea.disabled = false;
  textArea.style.opacity = "1";
});