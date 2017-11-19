import Papa from 'papaparse';

const fileInput = document.getElementById('csvFileInput');

// Test if FileReader API supported
if(!window.FileReader) {
    document.body.classList.add('fr-unsupported');
} else {
    fileInput.addEventListener('change', () => handleFileUpload());
}



const handleFileUpload = () => {
    const selectedFile = fileInput.files[0];
    parseCSV(selectedFile);
};

const parseCSV = (fileObj) => {
    Papa.parse(fileObj, {
        header: true,
        complete: (results, file) => processData(results),
        error: (error, file) => {
            console.log('Error:', error, file);
        }
    });
};

const processData = (results, files) => {
    console.log(results);
}


