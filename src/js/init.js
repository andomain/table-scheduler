import Papa from 'papaparse';
import { getDay, setHours, setMinutes } from 'date-fns'

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

    // Replace date with JS usable start time 
    const processed = results.data.map((meeting) => {
        const {year, month, day} = getDateParts(meeting.date);
        const [startHour, startMinute] = meeting.start_time.split(/\:/);
        const startTime = new Date(year, month, day, startHour, startMinute);
        
        meeting.date = startTime;
        return meeting;
    });

    const dailyAppointments = getAppointmentsByDay(processed);
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
            // Create start/end timestamps for each day/location
            // const dateStamp = getDateParts(appointments[day][location][0].date);
            // const startTime = dateStamp.setHours(startHour, startMinute);
            // const endTime = dateStamp.setHours(endHour, endMinute);

            // TO DO: Correctly pad appointments to create full days            
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
        locations[location] = sortByStartTime(locations[location]);
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
        week[dayOfWeekAsString(i)] = dataArr.filter(row => getDay(row.date) === i);
    }
    return week;
};

/* 
 * Get individual date parts
 */
const getDateParts = (dateString, delim = '/') => {
    const dateParts = dateString.split(delim);
    console.log(dateString, dateParts);
    return {
        year: dateParts[2],
        month: dateParts[1] - 1,
        day: dateParts[0],
    };
};
