import Papa from 'papaparse';

const fileInput = document.getElementById('csvFileInput');

// Test if FileReader API supported and attach listeners to file input
if(!window.FileReader) {
    document.body.classList.add('fr-unsupported');
} else {
    fileInput.addEventListener('change', () => handleFileUpload());
}

/* 
 * Handle adding of a file
 */
const handleFileUpload = () => {
    const selectedFile = fileInput.files[0];
    parseCSV(selectedFile);
};

/* 
 * Parse the input CSV
 */
const parseCSV = (fileObj) => {
    Papa.parse(fileObj, {
        header: true,
        complete: (results, file) => processData(results),
        error: (error, file) => {
            console.log('Error:', error, file);
        }
    });
};

/* 
 * Process the parsed results and split into days/tables etc.
 */
const processData = (results) => {
    const columns = results.meta.fields;
    const dailyAppointments = getAppointmentsByDay(results.data);
    const dailyAppointmentsByLocation = splitDaysByLocation(dailyAppointments);

    const paddedAppointments = padAppointments(dailyAppointmentsByLocation);

    console.log(paddedAppointments);
};

/* 
 * Pad a day/locations appointments with breaks to ensure a full 9-6 schedule
 */
 const padAppointments = (appointments, aptLength = 20, startHour = 9, endHour = 18, startMinute = 0, endMinute = 0) => {
    Object.keys(appointments).forEach((day) => {
        Object.keys(appointments[day]).forEach((location) => {
            // Sort appointments by start time
            appointments[day][location] = sortByStartTime(appointments[day][location]);

            // Create start/end timestamps for each day/location
            const dateStamp = convertToDate(appointments[day][location][0].date);
            const startTime = dateStamp.setHours(startHour, startMinute);
            const endTime = dateStamp.setHours(endHour, endMinute);  
        });
    });
    return appointments;
 }

const sortByStartTime = (arr) => {
    arr.sort((a, b) => {
        return a.start_time.localeCompare(b.start_time);
    });
    return arr;
}


/* 
 * Restructure a days appointments by location
 */
const splitDaysByLocation = (dailyAppointments) => {
    let processedAppointments = {};
    Object.keys(dailyAppointments).forEach((day) => {
        if(dailyAppointments[day].length > 0){
            processedAppointments[day] = splitByTable(dailyAppointments[day]);
        } else {
            console.log('No appointments for ', day);
            processedAppointments[day] = [];
        }
    });
    return processedAppointments;
}

/* 
 * Split a monolothic set of appointments by unique location
 */
const splitByTable = (appointments) => {
    const unique = [...new Set(appointments.map(apt => apt.meeting_point_name))];
    let locations = {};

    unique.forEach(location => {
        locations[location] = appointments.filter(apt => apt.meeting_point_name === location);
    });
    return locations;
}

/* 
 * Helper function to convert day index to human readable
 */
const dayOfWeekAsString = (dayIndex) => {
    return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayIndex];
}

/* 
 * Build array of appointments by day
 */
const getAppointmentsByDay = (dataArr) => {
    let week = {};
    for(let i = 0; i < 7; i++){
        week[dayOfWeekAsString(i)] = getRowsByDay(dataArr, i);
    }
    return week;
};

/* 
 * Get appointments by day of the week
 */
const getRowsByDay = (results, day) => {
    return results.filter((row) => {
        const date = convertToDate(row.date);
        return date.getDay() === day;
    });
};

/* 
 * Convert the DD/MM/YYYY date from the original CSV into JS date readable
 * format
 */
const convertToDate = (dateString, delim = '/') => {
    const dateParts = dateString.split(delim);
    return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
};
