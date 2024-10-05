// ---------------- IMAGE TO IMAGE CONVERSION ---------------- //

function initImageToImage() {
    const imageInput = document.getElementById('image-input');
    const imagePreview = document.getElementById('image-preview');
    const imageCount = document.getElementById('image-count');

    // Trigger file input when "Browse Images" is clicked
    document.getElementById('browse-image-button').addEventListener('click', function() {
        imageInput.click();
    });

    // Handle image selection and preview display
    imageInput.addEventListener('change', function() {
        const files = imageInput.files;
        imagePreview.innerHTML = ''; // Clear previous previews
        imageCount.textContent = `Selected ${files.length} image(s)`;

        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.classList.add('preview-image');
                imagePreview.appendChild(img);
            };
            reader.readAsDataURL(file); // Read file as Data URL
        });
    });

    // Handle the "Convert Image" button click for image conversion
    document.getElementById('convert-image-button').addEventListener('click', function() {
        const format = document.getElementById('image-format').value;
        const files = imageInput.files;

        if (files.length === 0) {
            alert('Please select at least one image.');
            return;
        }

        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.src = event.target.result;

                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    const link = document.createElement('a');
                    link.href = canvas.toDataURL(`image/${format}`);
                    link.download = `${file.name.split('.')[0]}.${format}`;
                    link.click();
                };
            };
            reader.readAsDataURL(file);
        });
    });
}

// ---------------- IMAGE TO PDF CONVERSION ---------------- //

function initImageToPDF() {
    const pdfInput = document.getElementById('pdf-input');
    const pdfPreview = document.getElementById('pdf-image-preview');

    // Trigger file input when "Browse Images" is clicked
    document.getElementById('browse-pdf-button').addEventListener('click', function() {
        pdfInput.click();
    });

    // Handle file selection and image preview
    pdfInput.addEventListener('change', function(event) {
        const files = event.target.files;
        pdfPreview.innerHTML = ''; // Clear previous previews

        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'preview-image'; // Add a class for styling
                pdfPreview.appendChild(img);
            };
            reader.readAsDataURL(file); // Read the file as Data URL
        });
    });

    // Handle the "Convert to PDF" button click
    document.getElementById('convert-pdf-button').addEventListener('click', async function() {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        const selectedImages = Array.from(pdfInput.files);

        // If no images are selected, show an alert
        if (selectedImages.length === 0) {
            alert('Please select at least one image.');
            return;
        }

        // Sequentially process each image and add to PDF
        for (let index = 0; index < selectedImages.length; index++) {
            const image = selectedImages[index];
            const fileExtension = image.name.split('.').pop().toLowerCase(); // Get the file extension

            try {
                if (index > 0) {
                    pdf.addPage(); // Add a new page before each image (except the first one)
                }

                // Handle SVG files separately
                if (fileExtension === 'svg') {
                    const imgData = await convertSVGtoPNG(image); // Convert SVG to PNG
                    await addImageToPDF(pdf, imgData, 'PNG'); // Add the converted PNG to the PDF
                } else {
                    const imgData = await readImageAsDataURL(image); // Read JPEG/PNG as Data URL
                    await addImageToPDF(pdf, imgData, 'JPEG'); // Add JPEG/PNG image to the PDF
                }
            } catch (error) {
                console.error("Error processing image:", error);
                alert("An error occurred while processing one of the images.");
                return;
            }
        }

        pdf.save('images.pdf'); // Save the PDF once all images are processed
    });
}

// Function to read image (JPEG/PNG) as a Data URL (wrapped in a Promise)
function readImageAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result); // Return Data URL
        };
        reader.onerror = function() {
            reject(new Error('Failed to read image as Data URL.'));
        };
        reader.readAsDataURL(file); // Read the file as Data URL
    });
}

// Helper function to convert SVG to PNG using a canvas (wrapped in a Promise)
async function convertSVGtoPNG(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const svgData = e.target.result;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const img = new Image();

            img.onload = function() {
                // Set canvas size to match the SVG dimensions
                canvas.width = img.width;
                canvas.height = img.height;
                // Draw the SVG onto the canvas
                context.drawImage(img, 0, 0);
                // Convert canvas content to PNG
                const pngData = canvas.toDataURL('image/png');
                resolve(pngData); // Return PNG data URL
            };

            img.onerror = function() {
                reject(new Error('Failed to load SVG image'));
            };

            img.src = svgData; // Load the SVG data into the image element
        };
        reader.onerror = function() {
            reject(new Error('Failed to read SVG file as Data URL.'));
        };
        reader.readAsDataURL(file); // Read the SVG file as a Data URL
    });
}

// Function to add an image (JPEG, PNG) to the PDF with proper scaling and placement
function addImageToPDF(pdf, imgData, format) {
    return new Promise((resolve, reject) => {
        const imgElement = new Image();
        imgElement.src = imgData;

        imgElement.onload = function() {
            // Get the dimensions of the image and calculate appropriate scaling
            const imgWidth = imgElement.width;
            const imgHeight = imgElement.height;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Scale the image to fit within the PDF page (adjusting for margins)
            const maxWidth = pageWidth - 20; // Leaving 10px margin on left and right
            const maxHeight = pageHeight - 20; // Leaving 10px margin on top and bottom
            let scaleFactor = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);

            const scaledWidth = imgWidth * scaleFactor;
            const scaledHeight = imgHeight * scaleFactor;

            // Center the image on the page
            const xPos = (pageWidth - scaledWidth) / 2;
            const yPos = (pageHeight - scaledHeight) / 2;

            pdf.addImage(imgElement, format, xPos, yPos, scaledWidth, scaledHeight); // Add image to PDF
            resolve(); // Resolve the promise when done
        };

        imgElement.onerror = function() {
            reject(new Error('Failed to load image.'));
        };
    });
}
