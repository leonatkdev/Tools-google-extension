"use strict";

document.addEventListener("DOMContentLoaded", () => {
  let selected;

  document
    .getElementById("colors")
    .addEventListener("click", () => openTab("colors"));
  document
    .getElementById("lorem")
    .addEventListener("click", () => openTab("lorem"));
  document
    .getElementById("images")
    .addEventListener("click", () => openTab("images"));
  document
    .getElementById("typografy")
    .addEventListener("click", () => openTab("typografy"));

  function openTab(tag) {
    if (selected !== tag && selected !== undefined) {
      document.getElementById(selected + "_section").style.display = "none";
    }

    selected = tag;
    document.getElementById(selected + "_section").style.display = "block";

    document.querySelector(".landingContainer").style.display = "none";
  }

  //redirect to landingcontent
  document.querySelectorAll(".header").forEach((head) => {
    head.querySelector(".goBack").addEventListener("click", () => {
      document.querySelector(".landingContainer").style.display = "grid";
      document.getElementById(selected + "_section").style.display = "none";
    });

    head.querySelectorAll('.ref div').forEach((reftag) => {
      reftag.addEventListener('click' , () => openTab(reftag.attributes.id.value))
    }) 
  });
});

