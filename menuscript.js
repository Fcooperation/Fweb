// menuscript.js

// Select elements
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");

// Toggle menu open/close
menuBtn.addEventListener("click", () => {
  sideMenu.classList.toggle("open");
});

// Example: define your menu buttons here
const menuItems = [
  { label: "Home", script: "home.js" },
  { label: "Settings", script: "settings.js" },
  { label: "About", script: "about.js" }
];

// Dynamically add menu buttons
const menuList = document.getElementById("menuList");
menuItems.forEach(item => {
  const btn = document.createElement("button");
  btn.textContent = item.label;
  btn.className = "menuItem";

  // When clicked, load that page.js
  btn.addEventListener("click", () => {
    // load the script dynamically
    const script = document.createElement("script");
    script.src = item.script;
    document.body.appendChild(script);

    // Close the menu after selection
    sideMenu.classList.remove("open");
  });

  menuList.appendChild(btn);
});