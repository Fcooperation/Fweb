const resultData =
JSON.parse(
  localStorage.getItem(
    "quizResult"
  )
);

const container =
document.getElementById(
  "review-container"
);

if (
  !resultData ||
  !resultData.review
){
  container.innerHTML =
  "<h3>No explanations found</h3>";
}
else{

  resultData.review.forEach(item=>{

    let html = `
      <div class="question-card">

      <div class="question">
        ${item.question}
      </div>
    `;

    item.options.forEach(opt=>{

      let cls = "";

      if(
        opt === item.correct
      ){
        cls = "correct";
      }

      if(
        opt === item.selected &&
        item.selected !== item.correct
      ){
        cls = "wrong";
      }

      html += `
        <div class="option ${cls}">
          ${opt}
        </div>
      `;
    });

    html += `
      <div class="explanation">

        <b>Explanation</b>

        <p>
          ${item.explanation ||
          "No explanation"}
        </p>

      </div>

      </div>
    `;

    container.innerHTML += html;

  });

}

const toast =
document.getElementById(
  "fai-toast"
);

setTimeout(() => {

  toast.classList.add(
    "show"
  );

}, 1000);

setTimeout(() => {

  toast.classList.remove(
    "show"
  );

}, 7000);

document
.getElementById("fai-btn")
.onclick = () => {

  if(
    !resultData ||
    !resultData.review
  ){
    return;
  }

  localStorage.setItem(
  "fai_review",
  JSON.stringify({
    review: resultData.review,
    source: "quiz-system",
    timestamp: Date.now()
  })
);

  window.location.href =
    "fai.html";

};