"use strict";

document.addEventListener("DOMContentLoaded", () => {
  let selected;

  chrome.storage.local.get("selectedTab", function (result) {
    if (result.selectedTab) {
      openTab(result.selectedTab);
    } else {
      document.querySelector(".landingContainer").style.display = "grid";
    }
  });

  document.getElementById("colors").addEventListener("click", () => openTab("colors"));
  document.getElementById("lorem").addEventListener("click", () => openTab("lorem"));
  document.getElementById("images").addEventListener("click", () => openTab("images"));
  document.getElementById("typografy").addEventListener("click", () => openTab("typografy"));
  document.getElementById("textTransformer").addEventListener("click", () => openTab("textTransformer"));

  function openTab(tag) {
    if (selected !== tag && selected !== undefined) {
      document.getElementById(selected + "_section").style.display = "none";
    }

    selected = tag;
    document.getElementById(selected + "_section").style.display = "block";

    document.querySelector(".landingContainer").style.display = "none";

    chrome.storage.local.set({ selectedTab: tag });
  }

  //redirect to landing content
  document.querySelectorAll(".header").forEach((head) => {
    head.querySelector(".goBack").addEventListener("click", () => {
      document.querySelector(".landingContainer").style.display = "grid";
      document.getElementById(selected + "_section").style.display = "none";
      chrome.storage.local.remove("selectedTab");
    });

    head.querySelectorAll('.ref div').forEach((reftag) => {
      reftag.addEventListener('click', () => openTab(reftag.attributes.id.value));
    });
  });
});
