// Handle browse button click to open file dialog
document.getElementById("browse-button").addEventListener("click", function () {
    document.getElementById("file-input").click();
});

const uploadBox = document.getElementById("upload-box");
const fileInput = document.getElementById("file-input");
const progressBar = document.getElementById("progress-bar");
const outputDiv = document.getElementById("output");
const convertButton = document.getElementById("convert-button");

let files = [];

// Handle drag-and-drop functionality
uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.style.backgroundColor = "#e8f0fe";
});

uploadBox.addEventListener("dragleave", () => {
    uploadBox.style.backgroundColor = "#fafafa";
});

uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.style.backgroundColor = "#fafafa";
    files = e.dataTransfer.files;
    displayFiles();
});

// Handle file selection via file input
fileInput.addEventListener("change", (e) => {
    files = e.target.files;
    displayFiles();
});

function displayFiles() {
    if (files.length > 0) {
        outputDiv.innerHTML = `<p>${files.length} file(s) selected</p>`;
    } else {
        outputDiv.innerHTML = "<p>No files selected</p>";
    }
}

// Convert images and send them to the backend
convertButton.addEventListener("click", () => {
    if (files.length === 0) {
        alert("Please select or drag & drop some images.");
        return;
    }

    const format = document.getElementById("format").value;
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
    }

    formData.append("format", format);

    // Reset and display progress bar
    progressBar.style.display = "block";
    progressBar.style.width = "0%";
    progressBar.style.transition = "width 0.5s ease";

    // Simulate progress while waiting for a response
    let progress = 0;
    const interval = setInterval(() => {
        if (progress < 80) {
            progress += 10;
            progressBar.style.width = `${progress}%`;
        } else {
            clearInterval(interval);
        }
    }, 500);

    // Send images to the backend
    fetch("https://convert-app-fnzz.onrender.com/convert", {
        method: "POST",
        body: formData
    })
        .then(response => {
            clearInterval(interval); // Clear the interval after response
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.blob();
        })
        .then(blob => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);

            // Check if multiple files were uploaded, then download as ZIP
            link.download = files.length > 1 ? "converted_images.zip" : `converted_image.${format}`;
            link.click();

            // Animate the progress bar to 100%
            progressBar.style.width = "100%";

            // Show success message
            outputDiv.innerHTML = `<p>Conversion successful! Your file(s) are downloaded.</p>`;
        })
        .catch(error => {
            console.error("Error during conversion:", error);
            outputDiv.innerHTML = `<p class="error">An error occurred during conversion. Please try again.</p>`;
        })
        .finally(() => {
            // Hide progress bar after completion
            setTimeout(() => {
                progressBar.style.display = "none";
                progressBar.style.width = "0%";
            }, 1000);
        });
});




// Add an on-load API call to warm up the backend
window.addEventListener("load", () => {
    // Replace with your backend URL
    const warmupUrl = "https://convert-app-fnzz.onrender.com/warmup"; 

    // Perform a dummy GET request to keep the server active
    fetch(warmupUrl, {
        method: "GET",
    })
    .then(response => console.log("Backend warmed up", response))
    .catch(error => console.error("Error warming up backend:", error));
});

