document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const resultSection = document.getElementById('result-section');
    const loadingState = document.getElementById('loading');
    const resultContent = document.getElementById('result-content');
    const previewImg = document.getElementById('preview-img');
    const extractedText = document.getElementById('extracted-text');
    const copyBtn = document.getElementById('copy-btn');
    const pdfBtn = document.getElementById('pdf-btn');
    const toast = document.getElementById('toast');
    
    let currentFile = null;

    // Handle Drag & Drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('dragover');
    }

    function unhighlight(e) {
        dropZone.classList.remove('dragover');
    }

    // Handle File Drop
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Handle File Input Click
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFile(this.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (PNG, JPG, etc).');
            return;
        }
        
        currentFile = file;

        // 1. Show Preview
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function() {
            previewImg.src = reader.result;
        }

        // 2. Prepare UI for loading
        resultSection.classList.remove('hidden');
        loadingState.classList.remove('hidden');
        resultContent.classList.add('hidden');

        // Scroll to result section gracefully
        setTimeout(() => {
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);

        // 3. Send API Request
        uploadImage(file);
    }

    // Handle PDF Button
    pdfBtn.addEventListener('click', async () => {
        if (!currentFile) return;
        
        const originalText = pdfBtn.innerHTML;
        pdfBtn.innerText = 'Creating...';
        const formData = new FormData();
        formData.append('file', currentFile);
        
        try {
            const response = await fetch('/ocr/pdf/', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error('Failed to generate PDF');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `OCR_Result_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert('Error generating PDF');
        } finally {
            pdfBtn.innerHTML = originalText;
        }
    });

    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/ocr/', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to process image');
            }

            const data = await response.json();
            
            // Show result
            loadingState.classList.add('hidden');
            resultContent.classList.remove('hidden');
            extractedText.value = data.extracted_text || 'No text was found in the image.';
            
        } catch (error) {
            console.error('Error:', error);
            loadingState.classList.add('hidden');
            resultContent.classList.remove('hidden');
            extractedText.value = `Error: ${error.message}`;
            extractedText.style.color = '#ef4444';
        }
    }

    // Handle Copy Button
    copyBtn.addEventListener('click', () => {
        if (!extractedText.value) return;
        
        navigator.clipboard.writeText(extractedText.value).then(() => {
            showToast();
        }).catch(err => {
            console.error('Failed to copy', err);
        });
    });

    function showToast() {
        toast.innerText = 'Text copied to clipboard!';
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});
