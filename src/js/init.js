import Papa from 'papaparse';
import { addMinutes, format, getDay, isBefore, isEqual, setHours, setMinutes } from 'date-fns';

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
    // Replace date with JS usable start time 
    const processed = results.data.map((meeting) => {
        const {year, month, day} = getDateParts(meeting.date);
        const [startHour, startMinute] = meeting.start_time.split(/\:/);
        
        meeting.date = new Date(year, month, day, startHour, startMinute);;
        return meeting;
    });

    const week = {};
    
    for(let i = 0; i < 7; i++){
        week[dayOfWeekAsString(i)] = processed.filter(row => getDay(row.date) === i);
    };

    const appointmentsByLocation = {};
    Object.keys(week).forEach((day) => {
        if(week[day].length > 0){
            appointmentsByLocation[day] = splitByTable(week[day]);
        } else {
            console.log('No appointments for ', day);
        }
    });

    const aptLength = 20;
    const startHour = 9;
    const startMinute = 0;
    const endHour = 18;
    const endMinute = 0;

    Object.keys(appointmentsByLocation).forEach((day) => {
        const thisDay = day;

        Object.keys(appointmentsByLocation[day]).forEach((table) => {
            const filename = `${day.toLowerCase()}-${table.toLowerCase().replace(/\s+/, '_')}`;
            const appointments = appointmentsByLocation[day][table];
            const today = appointments[0].date;
            let currentTime = setTime(today, startHour, startMinute);
            const endTime = setTime(today, endHour, endMinute);

            let aptIndex = 0;
            const paddedAppointments = [];

            while(isBefore(currentTime, endTime)){
                if(isEqual(appointments[aptIndex].date, currentTime)){
                    paddedAppointments.push(appointments[aptIndex]);
                    if(aptIndex < appointments.length - 1){
                        aptIndex++;
                    }
                } else {
                    paddedAppointments.push(createDummy(currentTime));
                }
                currentTime = addMinutes(currentTime, aptLength);
            }
            console.log(paddedAppointments);
        });
    });
};

const createDummy = (time) => {
    return {
        title: 'Break',
        date: time,
        start_time: format(time, 'HH:mm'),
    };
};

const setTime = (time, hour, minute) => {
    return setHours(setMinutes(time, minute), hour);
};

const sortByStartTime = (arr) => {
    arr.sort((a, b) => {
        return a.start_time.localeCompare(b.start_time);
    });
    return arr;
};

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
};

/* 
 * Helper function to convert day index to human readable
 */
const dayOfWeekAsString = (dayIndex) => {
    return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayIndex];
};

/* 
 * Get individual date parts
 */
const getDateParts = (dateString, delim = '/') => {
    const dateParts = dateString.split(delim);
    return {
        year: dateParts[2],
        month: dateParts[1] - 1,
        day: dateParts[0],
    };
};
