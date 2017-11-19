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
    const columns = results.meta.fields;
    const dailyAppointments = getAppointmentsByDay(results.data);
    
    console.log(dailyAppointments);
};

const getAppointmentsByDay = (dataArr) => {
    let week = {};
    for(let i = 0; i < 7; i++){
        week[i] = getRowsByDay(dataArr, i);
    }
    return week;
};

const getRowsByDay = (results, day) => {
    return results.filter((row) => {
        const date = convertToDate(row.date);
        return date.getDay() === day;
    });
};

const convertToDate = (dateString, delim = '/') => {
    const dateParts = dateString.split(delim);
    return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
};


