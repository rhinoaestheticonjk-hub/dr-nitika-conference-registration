document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("registrationForm");

  if (!form) {
    console.error("registrationForm not found");
    return;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    console.log("Form submitted correctly");

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    localStorage.setItem("registrationData", JSON.stringify(data));

    window.location.href = "success.html";
  });

});
