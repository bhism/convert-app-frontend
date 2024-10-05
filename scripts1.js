document.getElementById('imageInput').addEventListener('change', handleImageSelect);
document.getElementById('convertBtn').addEventListener('click', convertImagesToPDF);

let selectedImages = [];

function handleImageSelect(event) {
    const files = event.target.files;
    const imagePreview = document.getElementById('imagePreview');
    imagePreview.innerHTML = ''; // Clear previous previews
    selectedImages = []; // Clear previous selections

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            imagePreview.appendChild(img);
            selectedImages.push(e.target.result);
        };

        reader.readAsDataURL(file);
    }
}

function convertImagesToPDF() {
    if (selectedImages.length === 0) {
        alert("Please select at least one image.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    selectedImages.forEach((imageData, index) => {
        if (index > 0) {
            pdf.addPage();
        }
        pdf.addImage(imageData, 'JPEG', 10, 10, 180, 160);
    });

    const pdfData = pdf.output('blob');
    const downloadLink = document.getElementById('downloadLink');
    const pdfUrl = URL.createObjectURL(pdfData);

    downloadLink.href = pdfUrl;
    downloadLink.style.display = 'block'; // Show download link
}
